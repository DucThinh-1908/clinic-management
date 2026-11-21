/**
 * Script tự động cấu hình Kong API Gateway (Database Mode) cho CarePlus Clinic:
 * 1. Tạo 8 Consumers & ACL Groups tương ứng với 8 vai trò (admin, manager, doctor, pharmacist, cashier, receptionist, nurse, patient).
 * 2. Tạo Global Pre-Function Plugin tự động đọc JWT Token từ Keycloak và ánh xạ vào Kong Consumer / ACL Group.
 * 3. Tạo 13 Gateway Services, 16 Routes và gắn Plugin ACL (Allow / Deny) trực quan cho từng phân hệ.
 */

const KONG_ADMIN = 'http://localhost:8001';

async function kongReq(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${KONG_ADMIN}${path}`, opts);
  const text = await res.text();
  try {
    return { status: res.status, data: JSON.parse(text) };
  } catch {
    return { status: res.status, data: text };
  }
}

async function main() {
  console.log('=== BAT DAU KHOI TAO KONG API GATEWAY (FULL GUI & RBAC ACL MODE) ===');

  const statusRes = await kongReq('/status');
  if (statusRes.status !== 200) {
    console.error('Khong ket noi duoc Kong Admin API tai http://localhost:8001. Hay dam bao Docker container clinic-kong-gateway dang chay!');
    process.exit(1);
  }

  // 1. Tạo 8 Role Consumers + Gán vào ACL Group tương ứng + Tạo Key-Auth nội bộ để plugin ACL hoạt động chuẩn
  const roles = ['admin', 'manager', 'doctor', 'pharmacist', 'cashier', 'receptionist', 'nurse', 'patient'];
  for (const role of roles) {
    const consumerName = `role-${role}`;
    await kongReq(`/consumers/${consumerName}`, 'PUT', {
      username: consumerName,
      custom_id: role,
      tags: ['keycloak-role', role],
    });

    // Gán ACL group = tên role (ví dụ: pharmacist)
    const acls = await kongReq(`/consumers/${consumerName}/acls`);
    const hasGroup = acls.data?.data?.some((a) => a.group === role);
    if (!hasGroup) {
      await kongReq(`/consumers/${consumerName}/acls`, 'POST', {
        group: role,
        tags: ['rbac-group', role],
      });
    }

    // Tạo key-auth nội bộ = "internal-key-<role>"
    const keys = await kongReq(`/consumers/${consumerName}/key-auth`);
    const expectedKey = `internal-key-${role}`;
    const hasKey = keys.data?.data?.some((k) => k.key === expectedKey);
    if (!hasKey) {
      await kongReq(`/consumers/${consumerName}/key-auth`, 'POST', {
        key: expectedKey,
      });
    }
    console.log(`[Consumer & ACL Group] Da khoi tao vai tro: ${role} (Consumer: ${consumerName})`);
  }

  // 2. Định nghĩa 13 Gateway Services + Routes + Danh sách Role mặc định trong Plugin ACL (có thể sửa bằng chuột trên localhost:8002)
  const services = [
    {
      name: 'auth-service',
      url: 'http://host.docker.internal:8080/api/auth',
      tags: ['security', 'auth'],
      routes: [{ name: 'auth-api-route', paths: ['/api/auth'], strip_path: true }],
      aclAllow: null, // Công khai cho đăng nhập / đăng ký
    },
    {
      name: 'admin-rbac-service',
      url: 'http://host.docker.internal:8080/api/admin',
      tags: ['security', 'admin', 'rbac'],
      routes: [
        { name: 'admin-accounts-route', paths: ['/api/admin/accounts'], strip_path: false },
        { name: 'admin-roles-permissions-route', paths: ['/api/admin/roles-permissions'], strip_path: false },
        { name: 'admin-audit-logs-route', paths: ['/api/admin/record-access-logs'], strip_path: false },
      ],
      aclAllow: ['admin', 'manager'],
    },
    {
      name: 'pharmacy-inventory-service',
      url: 'http://host.docker.internal:8080/api/pharmacy',
      tags: ['pharmacy', 'inventory', 'rbac'],
      routes: [{ name: 'pharmacy-dispensation-route', paths: ['/api/pharmacy'], strip_path: true }],
      aclAllow: ['admin', 'manager', 'pharmacist'],
    },
    {
      name: 'medical-examination-service',
      url: 'http://host.docker.internal:8080/api/examinations',
      tags: ['clinical', 'doctor', 'rbac'],
      routes: [{ name: 'clinical-examination-route', paths: ['/api/examinations'], strip_path: true }],
      aclAllow: ['admin', 'manager', 'doctor', 'nurse'],
    },
    {
      name: 'billing-payment-service',
      url: 'http://host.docker.internal:8080/api/billing',
      tags: ['finance', 'billing', 'rbac'],
      routes: [{ name: 'billing-invoice-route', paths: ['/api/billing'], strip_path: true }],
      aclAllow: ['admin', 'manager', 'cashier'],
    },
    {
      name: 'reception-queue-service',
      url: 'http://host.docker.internal:8080/api/queue',
      tags: ['clinical', 'queue', 'rbac'],
      routes: [{ name: 'reception-queue-route', paths: ['/api/queue'], strip_path: true }],
      aclAllow: ['admin', 'manager', 'receptionist', 'doctor', 'nurse'],
    },
    {
      name: 'patient-emr-service',
      url: 'http://host.docker.internal:8080/api/patients',
      tags: ['clinical', 'emr', 'rbac'],
      routes: [{ name: 'patient-management-route', paths: ['/api/patients', '/api/medical-records'], strip_path: false }],
      aclAllow: ['admin', 'manager', 'doctor', 'nurse', 'receptionist', 'cashier', 'patient'],
    },
    {
      name: 'appointment-scheduling-service',
      url: 'http://host.docker.internal:8080/api/appointments',
      tags: ['clinical', 'booking'],
      routes: [{ name: 'appointment-booking-route', paths: ['/api/appointments'], strip_path: true }],
      aclAllow: ['admin', 'manager', 'receptionist', 'doctor', 'nurse', 'patient'],
    },
    {
      name: 'staff-scheduling-service',
      url: 'http://host.docker.internal:8080/api/staff-scheduling',
      tags: ['hr', 'scheduling', 'rbac'],
      routes: [{ name: 'staff-schedule-route', paths: ['/api/staff-scheduling', '/api/departments'], strip_path: false }],
      aclAllow: ['admin', 'manager', 'doctor', 'nurse', 'pharmacist', 'cashier', 'receptionist'],
    },
    {
      name: 'reports-analytics-service',
      url: 'http://host.docker.internal:8080/api/reports',
      tags: ['analytics', 'reports', 'rbac'],
      routes: [{ name: 'analytics-report-route', paths: ['/api/reports'], strip_path: true }],
      aclAllow: ['admin', 'manager', 'doctor', 'pharmacist'],
    },
    {
      name: 'careplus-web-portal',
      url: 'http://host.docker.internal:8080',
      tags: ['frontend', 'ui'],
      routes: [{ name: 'careplus-spa-route', paths: ['/'], strip_path: false }],
      aclAllow: null,
    },
    {
      name: 'keycloak-iam-service',
      url: 'http://clinic-keycloak:8080',
      tags: ['security', 'iam', 'keycloak'],
      routes: [{ name: 'keycloak-sso-route', paths: ['/realms', '/resources'], strip_path: false }],
      aclAllow: null,
    },
    {
      name: 'hashicorp-vault-service',
      url: 'http://clinic-vault:8200',
      tags: ['security', 'vault', 'secrets'],
      routes: [{ name: 'vault-api-route', paths: ['/v1/secret'], strip_path: false }],
      aclAllow: null,
    },
  ];

  // Mã Lua giải mã JWT Token của Keycloak để tự động lấy Role và gắn Header xác thực nội bộ cho Plugin ACL của Kong
  const jwtToKongRoleLua = `
local role = nil
local auth = kong.request.get_header("Authorization")
if auth and auth:find("^Bearer ") then
  local token = auth:sub(8)
  local p1, p2 = token:find("%.")
  if p1 then
    local p3 = token:find("%.", p2 + 1)
    if p3 then
      local b64 = token:sub(p2 + 1, p3 - 1):gsub("-", "+"):gsub("_", "/")
      local rem = #b64 % 4
      if rem > 0 then b64 = b64 .. string.rep("=", 4 - rem) end
      local payload = ngx.decode_base64(b64)
      if payload then
        local order = {"admin", "manager", "doctor", "pharmacist", "cashier", "receptionist", "nurse", "patient"}
        for _, r in ipairs(order) do
          if payload:find('"' .. r .. '"') then
            role = r
            break
          end
        end
      end
    end
  end
end
if not role then
  local headerRole = kong.request.get_header("X-User-Roles")
  if headerRole then
    local firstRole = headerRole:match("([^,]+)")
    if firstRole then role = firstRole:lower() end
  end
end
if not role then role = "patient" end
kong.service.request.set_header("X-Kong-Internal-Key", "internal-key-" .. role)
`;

  for (const svc of services) {
    await kongReq(`/services/${svc.name}`, 'PUT', {
      name: svc.name,
      url: svc.url,
      tags: svc.tags,
    });

    for (const rt of svc.routes) {
      await kongReq(`/services/${svc.name}/routes/${rt.name}`, 'PUT', {
        name: rt.name,
        paths: rt.paths,
        strip_path: rt.strip_path,
      });
    }

    // Nếu phân hệ có phân quyền theo Role (aclAllow), gắn bộ 3: pre-function (đọc JWT Keycloak) -> key-auth -> acl (Allow/Deny trên GUI)
    if (svc.aclAllow && svc.aclAllow.length > 0) {
      const existingPlugins = await kongReq(`/services/${svc.name}/plugins`);
      const list = existingPlugins.data?.data || [];

      const existingPre = list.find((p) => p.name === 'pre-function');
      if (!existingPre) {
        await kongReq(`/services/${svc.name}/plugins`, 'POST', {
          name: 'pre-function',
          instance_name: `jwt-bridge-${svc.name}`,
          config: { access: [jwtToKongRoleLua] },
          tags: [svc.name, 'jwt-bridge'],
        });
      } else {
        await kongReq(`/plugins/${existingPre.id}`, 'PATCH', {
          instance_name: `jwt-bridge-${svc.name}`,
          tags: [svc.name, 'jwt-bridge'],
        });
      }

      const existingKey = list.find((p) => p.name === 'key-auth');
      if (!existingKey) {
        await kongReq(`/services/${svc.name}/plugins`, 'POST', {
          name: 'key-auth',
          instance_name: `key-auth-${svc.name}`,
          config: {
            key_names: ['X-Kong-Internal-Key'],
            hide_credentials: true,
          },
          tags: [svc.name, 'role-binding'],
        });
      } else {
        await kongReq(`/plugins/${existingKey.id}`, 'PATCH', {
          instance_name: `key-auth-${svc.name}`,
          tags: [svc.name, 'role-binding'],
        });
      }

      const existingAcl = list.find((p) => p.name === 'acl');
      if (!existingAcl) {
        await kongReq(`/services/${svc.name}/plugins`, 'POST', {
          name: 'acl',
          instance_name: `acl-${svc.name}`,
          config: {
            allow: svc.aclAllow,
            hide_groups_header: false,
          },
          tags: [svc.name, ...svc.aclAllow.map((r) => `allow:${r}`)],
        });
      } else {
        await kongReq(`/plugins/${existingAcl.id}`, 'PATCH', {
          instance_name: `acl-${svc.name}`,
          tags: [svc.name, ...svc.aclAllow.map((r) => `allow:${r}`)],
        });
      }
    }

    console.log(`[Gateway Service] Da cau hinh: ${svc.name} ${svc.aclAllow ? '-> ACL Allow: [' + svc.aclAllow.join(', ') + ']' : '(Public)'}`);
  }

  console.log('===============================================================');
  console.log('HOAN TAT! Mo ngay http://localhost:8002 de quan ly va phan quyen API bang chuot!');
  console.log('===============================================================');
}

main().catch((err) => console.error('Loi:', err));

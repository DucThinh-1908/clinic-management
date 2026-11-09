// setup-keycloak-rbac.js
const KEYCLOAK_URL = 'http://localhost:8081';
const REALM = 'clinic-realm';
const CLIENT_ID_NAME = 'clinic-frontend';

const PERMISSIONS = [
  { name: 'USER_VIEW', description: 'Xem danh sách tài khoản' },
  { name: 'USER_CREATE', description: 'Tạo tài khoản mới' },
  { name: 'USER_LOCK', description: 'Khóa và mở khóa tài khoản' },
  { name: 'ROLE_ASSIGN', description: 'Phân quyền và gán vai trò' },
  { name: 'ROLE_MANAGE', description: 'Quản lý danh mục vai trò' },
  { name: 'RECORD_ACCESS_VIEW', description: 'Xem nhật ký truy cập hồ sơ bệnh án' },
  { name: 'MEDICAL_RECORD_VIEW', description: 'Xem hồ sơ bệnh án bệnh nhân' },
  { name: 'MEDICAL_RECORD_WRITE', description: 'Lập và chỉnh sửa hồ sơ bệnh án' },
  { name: 'PRESCRIPTION_CREATE', description: 'Kê đơn thuốc điều trị' },
  { name: 'DISPENSATION_MANAGE', description: 'Cấp phát thuốc và duyệt đơn' },
  { name: 'INVOICE_CREATE', description: 'Lập hóa đơn và thu tiền viện phí' },
  { name: 'APPOINTMENT_MANAGE', description: 'Tiếp đón và đặt lịch khám' },
];

const ROLES_MAP = {
  admin: [
    'USER_VIEW', 'USER_CREATE', 'USER_LOCK', 'ROLE_ASSIGN', 'ROLE_MANAGE',
    'RECORD_ACCESS_VIEW', 'MEDICAL_RECORD_VIEW', 'MEDICAL_RECORD_WRITE',
    'PRESCRIPTION_CREATE', 'DISPENSATION_MANAGE', 'INVOICE_CREATE', 'APPOINTMENT_MANAGE'
  ],
  doctor: [
    'MEDICAL_RECORD_VIEW', 'MEDICAL_RECORD_WRITE', 'PRESCRIPTION_CREATE', 'RECORD_ACCESS_VIEW', 'APPOINTMENT_MANAGE'
  ],
  nurse: [
    'MEDICAL_RECORD_VIEW', 'APPOINTMENT_MANAGE'
  ],
  cashier: [
    'INVOICE_CREATE', 'MEDICAL_RECORD_VIEW'
  ],
  pharmacist: [
    'DISPENSATION_MANAGE', 'PRESCRIPTION_CREATE'
  ],
  receptionist: [
    'APPOINTMENT_MANAGE', 'USER_VIEW'
  ],
  patient: [
    'APPOINTMENT_MANAGE', 'MEDICAL_RECORD_VIEW'
  ]
};

async function main() {
  console.log('1. Đang đăng nhập Keycloak Admin...');
  const tokenRes = await fetch(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: 'admin',
      password: 'admin_password',
    }),
  });
  if (!tokenRes.ok) {
    throw new Error(`Đăng nhập admin thất bại: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const { access_token } = await tokenRes.json();
  const authHeaders = {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  };

  // 2. Lấy client ID thực (UUID) của clinic-frontend
  console.log(`2. Tìm client "${CLIENT_ID_NAME}" trong realm "${REALM}"...`);
  const clientsRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients?clientId=${CLIENT_ID_NAME}`, {
    headers: authHeaders,
  });
  const clients = await clientsRes.json();
  if (!clients || clients.length === 0) {
    throw new Error(`Không tìm thấy client ${CLIENT_ID_NAME}`);
  }
  const clientUuid = clients[0].id;
  console.log(`-> Client UUID: ${clientUuid}`);

  // 3. Tạo các Client Roles (Permissions) cho clinic-frontend
  console.log('3. Khởi tạo danh mục Permissions (Client Roles)...');
  const existingClientRolesRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientUuid}/roles`, {
    headers: authHeaders,
  });
  const existingClientRoles = await existingClientRolesRes.json();
  const existingRoleNames = new Set(existingClientRoles.map(r => r.name));

  for (const perm of PERMISSIONS) {
    if (!existingRoleNames.has(perm.name)) {
      const createRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientUuid}/roles`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: perm.name,
          description: perm.description,
          clientRole: true,
        }),
      });
      if (createRes.ok || createRes.status === 201) {
        console.log(`   + Đã tạo Permission: ${perm.name} (${perm.description})`);
      } else {
        console.warn(`   ! Không thể tạo ${perm.name}: ${await createRes.text()}`);
      }
    } else {
      console.log(`   = Permission đã tồn tại: ${perm.name}`);
    }
  }

  // Lấy lại danh sách đầy đủ Client Roles với ID để gán composite
  const updatedRolesRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientUuid}/roles`, {
    headers: authHeaders,
  });
  const allClientRoles = await updatedRolesRes.json();
  const clientRoleMap = new Map(allClientRoles.map(r => [r.name, r]));

  // 4. Tạo các Realm Roles chính nếu chưa có
  console.log('4. Kiểm tra và khởi tạo các Realm Roles...');
  const existingRealmRolesRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/roles`, {
    headers: authHeaders,
  });
  const existingRealmRoles = await existingRealmRolesRes.json();
  const realmRoleNames = new Set(existingRealmRoles.map(r => r.name));

  for (const roleName of Object.keys(ROLES_MAP)) {
    if (!realmRoleNames.has(roleName)) {
      const createRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/roles`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: roleName,
          description: `Vai trò ${roleName} của hệ thống phòng khám`,
        }),
      });
      if (createRes.ok || createRes.status === 201) {
        console.log(`   + Đã tạo Realm Role: ${roleName}`);
      }
    } else {
      console.log(`   = Realm Role đã tồn tại: ${roleName}`);
    }
  }

  // 5. Gán Composite Roles (Gán các Client Roles vào từng Realm Role)
  console.log('5. Cấu hình Composite Roles (Liên kết quyền vào từng Role)...');
  for (const [roleName, permNames] of Object.entries(ROLES_MAP)) {
    const rolesToAssign = permNames
      .map(name => clientRoleMap.get(name))
      .filter(Boolean)
      .map(r => ({
        id: r.id,
        name: r.name,
        clientRole: true,
        containerId: clientUuid,
      }));

    if (rolesToAssign.length > 0) {
      const assignRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/roles/${roleName}/composites`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(rolesToAssign),
      });
      if (assignRes.ok || assignRes.status === 204) {
        console.log(`   ✓ Role "${roleName}": Đã liên kết ${rolesToAssign.length} quyền.`);
      } else {
        console.warn(`   ! Lỗi gán quyền cho "${roleName}": ${await assignRes.text()}`);
      }
    }
  }

  // 6. Thêm Protocol Mapper để đưa "permissions" vào Access Token và ID Token
  console.log('6. Cấu hình Protocol Mapper đưa claims "permissions" vào JWT Token...');
  const mappersRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientUuid}/protocol-mappers/models`, {
    headers: authHeaders,
  });
  const existingMappers = await mappersRes.json();
  const mapperName = 'client-permissions-mapper';
  const hasMapper = existingMappers && existingMappers.some(m => m.name === mapperName);

  if (!hasMapper) {
    const mapperPayload = {
      name: mapperName,
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-client-role-mapper',
      consentRequired: false,
      config: {
        'client.id': CLIENT_ID_NAME,
        'claim.name': 'permissions',
        'jsonType.label': 'String',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'userinfo.token.claim': 'true',
        'multivalued': 'true',
        'usermodel.clientRoleMapping.clientId': CLIENT_ID_NAME,
      },
    };
    const createMapperRes = await fetch(`${KEYCLOAK_URL}/admin/realms/${REALM}/clients/${clientUuid}/protocol-mappers/models`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(mapperPayload),
    });
    if (createMapperRes.ok || createMapperRes.status === 201) {
      console.log('   ✓ Đã tạo thành công Protocol Mapper "client-permissions-mapper"!');
    } else {
      console.warn('   ! Không thể tạo mapper:', await createMapperRes.text());
    }
  } else {
    console.log('   = Protocol Mapper "client-permissions-mapper" đã sẵn sàng.');
  }

  console.log('\n=== HOÀN TẤT THIẾT LẬP PHÂN QUYỀN TRÊN KEYCLOAK THÀNH CÔNG! ===');
}

main().catch(err => {
  console.error('Lỗi thiết lập:', err);
  process.exit(1);
});

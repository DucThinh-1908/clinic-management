import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import type { AuthUser, RoleItem, PermissionItem, MedicalRecordAccessLog } from '../types'

interface AdminAccountPortalProps {
  currentUser: AuthUser | null
}

export const AdminAccountPortal: React.FC<AdminAccountPortalProps> = ({ currentUser }) => {
  const location = useLocation()
  const navigate = useNavigate()

  const getTabFromPath = (path: string): 'accounts' | 'roles' | 'audit' => {
    if (path.includes('/admin/phan-quyen')) return 'roles'
    if (path.includes('/admin/nhat-ky-ho-so')) return 'audit'
    return 'accounts'
  }

  const [activeTab, setActiveTab] = useState<'accounts' | 'roles' | 'audit'>(() => getTabFromPath(location.pathname))

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname))
  }, [location.pathname])

  const handleTabChange = (tab: 'accounts' | 'roles' | 'audit') => {
    setActiveTab(tab)
    if (tab === 'accounts') navigate('/admin/tai-khoan')
    else if (tab === 'roles') navigate('/admin/phan-quyen')
    else if (tab === 'audit') navigate('/admin/nhat-ky-ho-so')
  }

  // Trạng thái tài khoản người dùng
  const [accounts, setAccounts] = useState<AuthUser[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState('patient')
  const [accountActionMessage, setAccountActionMessage] = useState<string | null>(null)

  // Trạng thái vai trò và quyền hạn
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [permissions, setPermissions] = useState<PermissionItem[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [userRoleSelection, setUserRoleSelection] = useState<string[]>([])
  const [roleMessage, setRoleMessage] = useState<string | null>(null)

  // Trạng thái nhật ký truy cập hồ sơ
  const [accessLogs, setAccessLogs] = useState<MedicalRecordAccessLog[]>([])
  const [logFilterAction, setLogFilterAction] = useState('ALL')
  const [logSearch, setLogSearch] = useState('')

  const isAuthorized = Boolean(
    currentUser &&
      currentUser.roles &&
      currentUser.roles.some((r) => r.toLowerCase() === 'admin' || r.toLowerCase() === 'manager')
  )

  // Fetch accounts
  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/admin/accounts?requesterId=' + (currentUser?.id || ''))
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
      }
    } catch {
      console.error('Loi tai danh sach tai khoan')
    }
  }

  // Fetch roles and permissions
  const loadRolesAndPermissions = async () => {
    try {
      const [rRes, pRes] = await Promise.all([
        fetch('/api/admin/roles-permissions/roles?requesterId=' + (currentUser?.id || '')),
        fetch('/api/admin/roles-permissions/permissions?requesterId=' + (currentUser?.id || '')),
      ])
      if (rRes.ok && pRes.ok) {
        setRoles(await rRes.json())
        setPermissions(await pRes.json())
      }
    } catch {
      console.error('Loi tai danh sach vai tro / quyen')
    }
  }

  // Fetch medical record access logs
  const loadAccessLogs = async () => {
    try {
      const res = await fetch('/api/admin/access-logs/medical-records?requesterId=' + (currentUser?.id || ''))
      if (res.ok) {
        setAccessLogs(await res.json())
      }
    } catch {
      console.error('Loi tai nhat ky truy cap ho so')
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      loadAccounts()
      loadRolesAndPermissions()
      loadAccessLogs()
    }
  }, [isAuthorized])

  // Tạo tài khoản mới
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccountActionMessage(null)
    try {
      const res = await fetch('/api/admin/accounts?adminId=' + (currentUser?.id || 1), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          email: newEmail,
          phone: newPhone,
          roleCodes: [newRole],
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAccountActionMessage('Tạo tài khoản thành công cho: ' + newUsername)
        setShowCreateModal(false)
        setNewUsername('')
        setNewPassword('')
        setNewEmail('')
        setNewPhone('')
        loadAccounts()
      } else {
        setAccountActionMessage('Lỗi: ' + (data.message || 'Không thể tạo tài khoản'))
      }
    } catch {
      setAccountActionMessage('Lỗi kết nối tới hệ thống.')
    }
  }

  // Lock / Unlock account
  const handleToggleStatus = async (user: AuthUser) => {
    const nextStatus = !user.isActive
    const actionText = nextStatus ? 'mở khóa' : 'khóa'

    if (!nextStatus) {
      if (currentUser?.id === user.id) {
        alert('Bạn không thể tự khóa tài khoản của chính mình.')
        return
      }
      const isCurrentManagerOnly = Boolean(
        currentUser?.roles?.some((r) => r.toLowerCase() === 'manager') &&
        !currentUser?.roles?.some((r) => r.toLowerCase() === 'admin')
      )
      const isTargetAdmin = user.roles?.some((r) => r.toLowerCase() === 'admin')
      if (isCurrentManagerOnly && isTargetAdmin) {
        alert('Quản lý không có quyền khóa tài khoản của Quản trị viên (Admin).')
        return
      }
    }

    const reason = prompt(`Xác nhận lý do ${actionText} tài khoản ${user.username}:`, nextStatus ? 'Mở khóa theo yêu cầu' : 'Tạm khóa để kiểm tra')
    if (reason === null) return

    try {
      const res = await fetch(`/api/admin/accounts/${user.id}/status?adminId=` + (currentUser?.id || ''), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus, reason }),
      })
      const data = await res.json()
      if (res.ok) {
        setAccountActionMessage(`Đã ${actionText} tài khoản ${user.username} thành công.`)
        loadAccounts()
      } else {
        setAccountActionMessage('Lỗi: ' + (data.message || 'Không thể cập nhật trạng thái tài khoản.'))
      }
    } catch {
      setAccountActionMessage('Lỗi cập nhật trạng thái tài khoản.')
    }
  }

  // Save user roles
  const handleSaveUserRoles = async () => {
    if (!selectedUserId) return
    setRoleMessage(null)
    try {
      const res = await fetch(`/api/admin/roles-permissions/users/${selectedUserId}/roles?adminId=` + (currentUser?.id || 1), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleCodes: userRoleSelection }),
      })
      if (res.ok) {
        setRoleMessage('Cập nhật vai trò cho người dùng thành công!')
        loadAccounts()
      } else {
        const d = await res.json()
        setRoleMessage('Lỗi: ' + (d.message || 'Không thể gán vai trò'))
      }
    } catch {
      setRoleMessage('Lỗi kết nối tới máy chủ.')
    }
  }

  const handleSelectUserForRoles = (user: AuthUser) => {
    setSelectedUserId(user.id)
    setUserRoleSelection([...user.roles])
    setRoleMessage(null)
  }

  // Filter accounts
  const filteredAccounts = accounts.filter(
    (a) =>
      a.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (a.phone && a.phone.includes(searchKeyword)) ||
      a.roles.some((r) => r.toLowerCase().includes(searchKeyword.toLowerCase()))
  )

  // Lọc nhật ký truy cập hồ sơ
  const filteredLogs = accessLogs.filter((log) => {
    const matchesAction = logFilterAction === 'ALL' || log.action === logFilterAction
    const matchesSearch =
      log.username.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.recordCode.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.patientName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.reason.toLowerCase().includes(logSearch.toLowerCase())
    return matchesAction && matchesSearch
  })

  if (!currentUser) {
    return (
      <div style={{ background: '#f8fafb', minHeight: '80vh', padding: '60px 0', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', background: '#fff', padding: '40px 30px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(8,127,140,.12)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: '26px', margin: '0 auto 16px', fontWeight: 700 }}>
            !
          </div>
          <h2 style={{ fontSize: '22px', margin: '0 0 10px', color: 'var(--ink)' }}>Yêu cầu đăng nhập</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14.5px', lineHeight: 1.6, margin: '0 0 24px' }}>
            Quý khách cần đăng nhập tài khoản Quản trị viên (Admin) hoặc Quản lý phòng khám (Manager) để truy cập chức năng này.
          </p>
          <Link className="btn btn-primary" to="/dang-nhap" style={{ width: '100%', display: 'inline-block', boxSizing: 'border-box' }}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div style={{ background: '#f8fafb', minHeight: '80vh', padding: '60px 0', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', background: '#fff', padding: '40px 30px', borderRadius: '16px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'grid', placeItems: 'center', fontSize: '26px', margin: '0 auto 16px', fontWeight: 700 }}>
            !
          </div>
          <h2 style={{ fontSize: '22px', margin: '0 0 10px', color: '#991b1b' }}>Truy cập bị từ chối</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14.5px', lineHeight: 1.6, margin: '0 0 24px' }}>
            Tài khoản hiện tại ({currentUser.username}) không có quyền quản trị. Chỉ Quản trị viên (Admin) và Quản lý phòng khám (Manager) mới được phép quản lý tài khoản, phân quyền gán vai trò và xem nhật ký truy cập hồ sơ.
          </p>
          <Link className="btn btn-secondary" to="/trang-chu" style={{ width: '100%', display: 'inline-block', boxSizing: 'border-box' }}>
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#f8fafb', minHeight: '85vh', padding: '40px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="eyebrow">Phân hệ quản trị hệ thống</span>
            <h1 style={{ margin: '4px 0 0', fontSize: '28px', color: 'var(--ink)' }}>
              Quản lý tài khoản và phân quyền
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${activeTab === 'accounts' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => handleTabChange('accounts')}
            >
              Quản lý tài khoản
            </button>
            <button
              className={`btn ${activeTab === 'roles' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => handleTabChange('roles')}
            >
              Phân quyền & Gán vai trò
            </button>
            <button
              className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-light'}`}
              onClick={() => handleTabChange('audit')}
            >
              Nhật ký truy cập hồ sơ
            </button>
          </div>
        </div>

        {accountActionMessage && (
          <div
            style={{
              background: '#def7ec',
              color: '#03543f',
              padding: '12px 18px',
              borderRadius: '8px',
              marginBottom: '20px',
              borderLeft: '4px solid #0e9f6e',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{accountActionMessage}</span>
            <button
              onClick={() => setAccountActionMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              X
            </button>
          </div>
        )}

        {/* TAB 1: QUẢN LÝ TÀI KHOẢN */}
        {activeTab === 'accounts' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', margin: '0 0 4px', color: 'var(--ink)' }}>
                  Danh sách tài khoản người dùng
                </h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13.5px' }}>
                  Tác nhân: Quản trị viên | Chức năng: Tạo tài khoản, khóa và mở khóa tài khoản
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm tên đăng nhập, email, vai trò..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '13.5px',
                    width: '260px',
                  }}
                />
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                  + Tạo tài khoản mới
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--soft)', borderBottom: '2px solid var(--border)', color: 'var(--primary-dark)' }}>
                    <th style={{ padding: '12px 16px' }}>ID</th>
                    <th style={{ padding: '12px 16px' }}>Tên đăng nhập</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Số điện thoại</th>
                    <th style={{ padding: '12px 16px' }}>Vai trò hệ thống</th>
                    <th style={{ padding: '12px 16px' }}>Trạng thái</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>#{acc.id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 650 }}>{acc.username}</td>
                      <td style={{ padding: '12px 16px', color: '#4b5563' }}>{acc.email || '-'}</td>
                      <td style={{ padding: '12px 16px', color: '#4b5563' }}>{acc.phone || '-'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {acc.roles.map((r) => (
                            <span
                              key={r}
                              style={{
                                background: 'var(--primary-light)',
                                color: 'var(--primary-dark)',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            background: acc.isActive ? '#def7ec' : '#fde8e8',
                            color: acc.isActive ? '#03543f' : '#9b1c1c',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {acc.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {(() => {
                          const isSelf = currentUser?.id === acc.id
                          const isCurrentManagerOnly = Boolean(
                            currentUser?.roles?.some((r) => r.toLowerCase() === 'manager') &&
                            !currentUser?.roles?.some((r) => r.toLowerCase() === 'admin')
                          )
                          const isTargetAdmin = acc.roles?.some((r) => r.toLowerCase() === 'admin')
                          const cannotLock = acc.isActive && (isSelf || (isCurrentManagerOnly && isTargetAdmin))
                          const disabledTitle = isSelf
                            ? 'Không thể tự khóa tài khoản của chính mình'
                            : isCurrentManagerOnly && isTargetAdmin
                            ? 'Quản lý không có quyền khóa tài khoản của Quản trị viên'
                            : ''

                          return (
                            <button
                              className={`btn btn-sm ${acc.isActive ? 'btn-outline' : 'btn-primary'}`}
                              style={{
                                padding: '5px 12px',
                                borderColor: cannotLock ? 'var(--border)' : acc.isActive ? '#e02424' : 'var(--primary)',
                                color: cannotLock ? 'var(--muted)' : acc.isActive ? '#e02424' : '#ffffff',
                                opacity: cannotLock ? 0.6 : 1,
                                cursor: cannotLock ? 'not-allowed' : 'pointer',
                              }}
                              disabled={cannotLock}
                              title={disabledTitle}
                              onClick={() => handleToggleStatus(acc)}
                            >
                              {acc.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            </button>
                          )
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PHÂN QUYỀN & GÁN VAI TRÒ */}
        {activeTab === 'roles' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left: User role assignment */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', color: 'var(--ink)' }}>
                Gán vai trò cho tài khoản
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 20px' }}>
                Chọn tài khoản người dùng và chỉ định các vai trò tương ứng trong hệ thống
              </p>

              {roleMessage && (
                <div
                  style={{
                    background: '#def7ec',
                    color: '#03543f',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '13.5px',
                  }}
                >
                  {roleMessage}
                </div>
              )}

              <div className="field">
                <label>Chọn tài khoản cần phân vai trò</label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => {
                    const uid = Number(e.target.value)
                    const found = accounts.find((a) => a.id === uid)
                    if (found) handleSelectUserForRoles(found)
                  }}
                >
                  <option value="">-- Chọn tài khoản --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.username} ({acc.roles.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {selectedUserId && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '8px' }}>
                    Danh sách vai trò gán cho người dùng:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    {roles.map((role) => {
                      const isChecked = userRoleSelection.includes(role.code)
                      return (
                        <label
                          key={role.code}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)',
                            background: isChecked ? 'var(--soft)' : '#fff',
                            cursor: 'pointer',
                            fontSize: '13.5px',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUserRoleSelection([...userRoleSelection, role.code])
                              } else {
                                setUserRoleSelection(userRoleSelection.filter((c) => c !== role.code))
                              }
                            }}
                          />
                          <div>
                            <strong>{role.name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{role.code}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>

                  <button className="btn btn-primary" onClick={handleSaveUserRoles} style={{ width: '100%' }}>
                    Lưu vai trò cho tài khoản
                  </button>
                </div>
              )}
            </div>

            {/* Right: Roles & Permissions directory */}
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', color: 'var(--ink)' }}>
                Danh mục {roles.length} vai trò & {permissions.length} quyền hệ thống
              </h2>
              <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 20px' }}>
                Cấu trúc phân quyền chức năng theo từng vai trò trong phòng khám
              </p>

              <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roles.map((role) => (
                  <div key={role.code} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ color: 'var(--primary-dark)', fontSize: '14.5px' }}>{role.name}</strong>
                      <span style={{ fontSize: '11.5px', background: 'var(--soft)', padding: '2px 8px', borderRadius: '4px', fontWeight: 650 }}>
                        {role.code}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '8px' }}>
                      {role.description}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {role.permissions && role.permissions.length > 0 ? (
                        role.permissions.map((p) => (
                          <span
                            key={p.code}
                            style={{
                              background: '#edf2f7',
                              color: '#2d3748',
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {p.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Chưa gán quyền riêng biệt</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: NHẬT KÝ TRUY CẬP HỒ SƠ */}
        {activeTab === 'audit' && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '28px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '20px', margin: '0 0 4px', color: 'var(--ink)' }}>
                  Nhật ký truy cập hồ sơ bệnh án
                </h2>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13.5px' }}>
                  Tác nhân: Quản trị viên, Quản lý | Lưu vết lịch sử truy cập, xem và sửa đổi hồ sơ
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  value={logFilterAction}
                  onChange={(e) => setLogFilterAction(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '13.5px',
                  }}
                >
                  <option value="ALL">Tất cả hành động</option>
                  <option value="VIEW_RECORD">Xem hồ sơ (VIEW)</option>
                  <option value="EDIT_RECORD">Chỉnh sửa hồ sơ (EDIT)</option>
                  <option value="PRINT_RECORD">In hồ sơ (PRINT)</option>
                </select>

                <input
                  type="text"
                  placeholder="Tìm mã hồ sơ, bác sĩ, bệnh nhân..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    fontSize: '13.5px',
                    width: '260px',
                  }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--soft)', borderBottom: '2px solid var(--border)', color: 'var(--primary-dark)' }}>
                    <th style={{ padding: '12px 14px' }}>Thời gian</th>
                    <th style={{ padding: '12px 14px' }}>Người truy cập</th>
                    <th style={{ padding: '12px 14px' }}>Vai trò</th>
                    <th style={{ padding: '12px 14px' }}>Hành động</th>
                    <th style={{ padding: '12px 14px' }}>Mã hồ sơ</th>
                    <th style={{ padding: '12px 14px' }}>Bệnh nhân</th>
                    <th style={{ padding: '12px 14px' }}>Lý do thao tác</th>
                    <th style={{ padding: '12px 14px' }}>Địa chỉ IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 650 }}>{log.username}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: '#edf2f7', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {log.roleName}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            background:
                              log.action === 'VIEW_RECORD'
                                ? '#e1effe'
                                : log.action === 'EDIT_RECORD'
                                ? '#fef08a'
                                : '#def7ec',
                            color:
                              log.action === 'VIEW_RECORD'
                                ? '#1e429f'
                                : log.action === 'EDIT_RECORD'
                                ? '#713f12'
                                : '#03543f',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--primary)' }}>
                        {log.recordCode}
                      </td>
                      <td style={{ padding: '12px 14px' }}>{log.patientName}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--ink)' }}>{log.reason}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: '12px' }}>
                        {log.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Account Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                X
              </button>
              <div style={{ marginBottom: '18px' }}>
                <span className="eyebrow">Quản trị hệ thống</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '20px' }}>Tạo tài khoản người dùng mới</h3>
              </div>

              <form onSubmit={handleCreateAccount}>
                <div className="field">
                  <label>Tên đăng nhập</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Ví dụ: bs.minh, letan02"
                  />
                </div>

                <div className="field">
                  <label>Mật khẩu ban đầu</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (mặc định 123456 nếu để trống)"
                  />
                </div>

                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@careplusclinic.vn"
                  />
                </div>

                <div className="field">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0901234567"
                  />
                </div>

                <div className="field">
                  <label>Vai trò khởi tạo</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    {roles.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <button type="button" className="btn btn-light" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                    Xác nhận tạo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

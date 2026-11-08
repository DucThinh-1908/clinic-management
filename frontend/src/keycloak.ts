import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: 'http://localhost:8081',      // Địa chỉ máy chủ Keycloak
  realm: 'clinic-realm',             // Tên Realm đã tạo ở Bước 1
  clientId: 'clinic-frontend',       // Client ID đã tạo ở Bước 2
})

export default keycloak
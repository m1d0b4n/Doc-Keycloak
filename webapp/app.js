// Configuration Keycloak
const keycloak = new Keycloak({
    url: 'http://localhost:8085',
    realm: 'mon-realm-tp',
    clientId: 'mon-app-web'
});

// Initialisation de Keycloak
keycloak.init({
    onLoad: 'check-sso',
    checkLoginIframe: false
}).then(authenticated => {
    if (authenticated) {
        showMainScreen();
    } else {
        showLoginScreen();
    }
}).catch(error => {
    console.error('Erreur d\'initialisation Keycloak:', error);
});

// Fonction de connexion
function login() {
    keycloak.login();
}

// Fonction de déconnexion
function logout() {
    keycloak.logout({
        redirectUri: window.location.origin
    });
}

// Rafraîchir le token
function refreshToken() {
    keycloak.updateToken(30).then(refreshed => {
        if (refreshed) {
            console.log('Token rafraîchi');
            displayTokenInfo();
        } else {
            console.log('Token toujours valide');
        }
    }).catch(error => {
        console.error('Erreur lors du rafraîchissement:', error);
        logout();
    });
}

// Afficher l'écran de connexion
function showLoginScreen() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('main-screen').classList.add('hidden');
}

// Afficher l'écran principal
function showMainScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    
    // Charger les informations utilisateur
    keycloak.loadUserProfile().then(profile => {
        document.getElementById('username').textContent = profile.username || 'N/A';
        document.getElementById('email').textContent = profile.email || 'N/A';
        document.getElementById('fullname').textContent = 
            `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'N/A';
        
        // Afficher les rôles
        const roles = keycloak.realmAccess?.roles || [];
        document.getElementById('roles').textContent = roles.join(', ') || 'Aucun rôle';
        
        // Vérifier si l'utilisateur est admin
        if (keycloak.hasRealmRole('admin')) {
            document.getElementById('admin-section').classList.remove('hidden');
        }
        
        // Afficher le token
        displayTokenInfo();
    }).catch(error => {
        console.error('Erreur lors du chargement du profil:', error);
    });
}

// Décoder et afficher le token JWT
function displayTokenInfo() {
    if (keycloak.token) {
        try {
            const tokenParsed = keycloak.tokenParsed;
            const tokenInfo = {
                'Utilisateur (sub)': tokenParsed.sub,
                'Username (preferred_username)': tokenParsed.preferred_username,
                'Email': tokenParsed.email,
                'Rôles (realm_access)': JSON.stringify(tokenParsed.realm_access, null, 2),
                'Émis à (iat)': new Date(tokenParsed.iat * 1000).toLocaleString(),
                'Expire à (exp)': new Date(tokenParsed.exp * 1000).toLocaleString(),
                'Issuer (iss)': tokenParsed.iss
            };
            
            let display = '';
            for (const [key, value] of Object.entries(tokenInfo)) {
                display += `<strong>${key}:</strong> ${value}<br><br>`;
            }
            
            document.getElementById('token-display').innerHTML = display;
        } catch (error) {
            console.error('Erreur lors du décodage du token:', error);
        }
    }
}

// Auto-refresh du token toutes les 30 secondes
setInterval(() => {
    if (keycloak.authenticated) {
        keycloak.updateToken(70).catch(() => {
            console.error('Failed to refresh token');
        });
    }
}, 30000);


export const setupAuthButtons = () => {
	const loginButton = document.querySelector('button.login')
	loginButton?.addEventListener('click', () => window.location.href = '/auth/github')
	
	const logoutButton = document.querySelector('button.logout')
	logoutButton?.addEventListener('click', () => window.location.href = '/logout')
}
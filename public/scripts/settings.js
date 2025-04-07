
export const setupSettings = () => {
	const displayNameInput = document.querySelector('input#display-name')
	const colorInput = document.querySelector('input#color')
	const saveButton = document.querySelector('button#save')

	const username = saveButton?.dataset?.username
	if (!username) return

	if (!displayNameInput || !colorInput || !saveButton) return

	const avatarElement = document.querySelector('.avatar')
	const onColorChange = () => {
		if (!avatarElement) return
		avatarElement.style.borderColor = colorInput.value
	}

	colorInput.addEventListener('input', onColorChange)
	colorInput.addEventListener('change', onColorChange)

	saveButton.addEventListener('click', async () => {
		const displayName = displayNameInput.value
		const color = colorInput.value

		if (!displayName || !color) return

		const request = await fetch(`/api/v1/users/${username}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, displayName, color })
		})

		if (request.ok) {
			saveButton.innerText = 'Saved!'
			saveButton.disabled = true
			document.querySelector('main > div .username').innerText = displayName
			setTimeout(() => {
				saveButton.innerText = 'Save'
				saveButton.disabled = false
			}, 2000)
		} 

	})
}
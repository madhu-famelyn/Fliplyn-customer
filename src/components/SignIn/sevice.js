export async function login(email, password) {
  const formData = new URLSearchParams();
  formData.append('username', email); // ← FastAPI expects 'username' field!
  formData.append('password', password);

  const response = await fetch('https://fliplyn-api.onrender.com/admin/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Login failed');
  }

  return await response.json(); // { access_token, token_type }
}

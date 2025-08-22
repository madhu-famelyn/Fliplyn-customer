// 📁 src/services/signupService.js

export async function signUp(data) {
  const response = await fetch('http://127.0.0.1:8000/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Signup failed');
  }

  return await response.json();
}

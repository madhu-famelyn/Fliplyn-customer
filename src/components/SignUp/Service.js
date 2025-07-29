// 📁 src/services/signupService.js

// Service.js
export async function signUp(data) {
  const response = await fetch('https://fliplyn.onrender.com/admin/admin', {
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

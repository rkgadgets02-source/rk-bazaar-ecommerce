async function test() {
  const email = 'test' + Date.now() + '@example.com';
  console.log('Registering user:', email);
  let res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test', email, phone: '1234567890', password: 'Password@123' })
  });
  let data = await res.json();
  console.log('Register response:', data);

  // Note: in this system, register might send OTP. Let's force verify in DB, or just use login if they have OTP off.
  // Actually, let's login directly if auth tests fail.
  // wait, register sends OTP. I can't login without OTP in this app.
  // Let me just look at the code for /api/cart/add.
}
test();

async function testKey(key) {
  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
      },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    console.log(key, data.message);
  } catch(e) {
    console.log(e);
  }
}

testKey('FLWSECK-b9cf0372e826a9789d1e0097fc6c1171-19d992b018dvt-X');

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'lab@stream.edu',
      password: 'Demo@123'
    });
    const token = loginRes.data.data.token;

    const formData = new FormData();
    formData.append('uniqueId', '1235');
    formData.append('itemName', 'm');
    formData.append('category', 'Adhesive and tapes');
    formData.append('section', '');
    formData.append('label', '');
    formData.append('newQty', '1');
    formData.append('availableQty', '1');
    formData.append('usedQty', '0');
    formData.append('damagedQty', '0');
    formData.append('consumedQty', '0');
    formData.append('remarks', '');
    formData.append('brc', '32110100105SH');
    formData.append('district', 'NA');
    fs.writeFileSync('test_img.jpg', 'dummy');
    formData.append('img', fs.createReadStream('test_img.jpg'));

    console.log('Creating stock...');
    const createRes = await axios.post('http://localhost:5000/api/stocks', formData, {
      headers: { 
        ...formData.getHeaders(),
        Authorization: `Bearer ${token}` 
      }
    });

    const stockId = createRes.data.data.stock.id;
    console.log('Created stock ID:', stockId);

    console.log('Updating stock...');
    const updateRes = await axios.put(`http://localhost:5000/api/stocks/${stockId}`, {
      remarks: 'l',
      month: 'June'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Update success!', updateRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();

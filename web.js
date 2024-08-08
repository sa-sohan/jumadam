const express = require('express');
const path = require('path');
const app = express();

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

// 모든 라우트를 index.html로 리디렉션
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 8001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

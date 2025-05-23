const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({
    expenses: [],
    balance: 550000
  }));
}

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper function to read/write data
const getData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const saveData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/expenses', (req, res) => {
  const data = getData();
  res.render('expenses', { expenses: data.expenses });
});

app.post('/add', (req, res) => {
  const { amount, itemName, category, date } = req.body;
  const data = getData();
  
  data.expenses.push({
    id: Date.now().toString(),
    amount: parseFloat(amount),
    itemName,
    category,
    date: date || new Date().toISOString().split('T')[0]
  });
  
  data.balance -= parseFloat(amount);
  saveData(data);
  res.redirect('/expenses');
});

app.get('/edit/:id', (req, res) => {
  const data = getData();
  const expense = data.expenses.find(e => e.id === req.params.id);
  res.render('edit', { expense });
});

app.post('/update/:id', (req, res) => {
  const { amount, itemName, category, date } = req.body;
  const data = getData();
  
  const expenseIndex = data.expenses.findIndex(e => e.id === req.params.id);
  if (expenseIndex !== -1) {
    // Add back the old amount before subtracting new amount
    data.balance += data.expenses[expenseIndex].amount;
    
    data.expenses[expenseIndex] = {
      ...data.expenses[expenseIndex],
      amount: parseFloat(amount),
      itemName,
      category,
      date
    };
    
    data.balance -= parseFloat(amount);
    saveData(data);
  }
  
  res.redirect('/expenses');
});

app.post('/delete/:id', (req, res) => {
  const data = getData();
  const expenseIndex = data.expenses.findIndex(e => e.id === req.params.id);
  
  if (expenseIndex !== -1) {
    data.balance += data.expenses[expenseIndex].amount;
    data.expenses.splice(expenseIndex, 1);
    saveData(data);
  }
  
  res.redirect('/expenses');
});

app.get('/report', (req, res) => {
  const data = getData();
  res.render('report', { 
    expenses: data.expenses,
    balance: data.balance
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
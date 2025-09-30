const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuration session
app.use(session({
  secret: 'testim-ai-demo-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 3600000 } // 1 heure
}));

// Base de données simulée
const users = [
  {
    id: '1',
    email: 'user@example.com',
    password: '$2b$10$rQZ8kHWfQxwjKV.nQJ8zKOqGJ8kHWfQxwjKV.nQJ8zKOqGJ8kHWfQx', // password123
    name: 'Utilisateur Test',
    role: 'user'
  },
  {
    id: '2',
    email: 'admin@example.com',
    password: '$2b$10$rQZ8kHWfQxwjKV.nQJ8zKOqGJ8kHWfQxwjKV.nQJ8zKOqGJ8kHWfQx', // password123
    name: 'Administrateur',
    role: 'admin'
  }
];

const products = [
  {
    id: '1',
    name: 'Smartphone Pro',
    price: 899.99,
    category: 'Electronics',
    stock: 15,
    image: '/images/smartphone.jpg'
  },
  {
    id: '2',
    name: 'Laptop Gaming',
    price: 1299.99,
    category: 'Electronics',
    stock: 8,
    image: '/images/laptop.jpg'
  },
  {
    id: '3',
    name: 'Casque Audio',
    price: 199.99,
    category: 'Audio',
    stock: 25,
    image: '/images/headphones.jpg'
  },
  {
    id: '4',
    name: 'Montre Connectée',
    price: 349.99,
    category: 'Wearables',
    stock: 12,
    image: '/images/smartwatch.jpg'
  }
];

let orders = [];
let carts = {};

// Middleware d'authentification
const requireAuth = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

// Routes principales
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

app.get('/cart', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// API Routes
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Simulation de délai réseau
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }
  
  const isValidPassword = await bcrypt.compare(password, user.password);
  
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }
  
  req.session.userId = user.id;
  req.session.userEmail = user.email;
  req.session.userName = user.name;
  
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/user', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  let filteredProducts = [...products];
  
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }
  
  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json(filteredProducts);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({ error: 'Produit non trouvé' });
  }
  
  res.json(product);
});

app.post('/api/cart/add', requireAuth, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const userId = req.session.userId;
  
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Produit non trouvé' });
  }
  
  if (product.stock < quantity) {
    return res.status(400).json({ error: 'Stock insuffisant' });
  }
  
  if (!carts[userId]) {
    carts[userId] = [];
  }
  
  const existingItem = carts[userId].find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[userId].push({
      productId,
      quantity,
      addedAt: new Date()
    });
  }
  
  res.json({ success: true, cartItemCount: carts[userId].length });
});

app.get('/api/cart', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const userCart = carts[userId] || [];
  
  const cartWithProducts = userCart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product,
      total: product.price * item.quantity
    };
  });
  
  const totalAmount = cartWithProducts.reduce((sum, item) => sum + item.total, 0);
  
  res.json({
    items: cartWithProducts,
    totalAmount,
    itemCount: userCart.length
  });
});

app.post('/api/orders', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const userCart = carts[userId] || [];
  
  if (userCart.length === 0) {
    return res.status(400).json({ error: 'Panier vide' });
  }
  
  const order = {
    id: uuidv4(),
    userId,
    items: userCart.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        total: product.price * item.quantity
      };
    }),
    totalAmount: userCart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product.price * item.quantity);
    }, 0),
    status: 'confirmed',
    createdAt: new Date()
  };
  
  orders.push(order);
  carts[userId] = []; // Vider le panier
  
  res.json(order);
});

app.get('/api/orders', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const userOrders = orders.filter(order => order.userId === userId);
  
  res.json(userOrders);
});

// Route pour simuler des changements d'interface (pour tester l'auto-healing)
app.post('/api/simulate-ui-change', (req, res) => {
  const { changeType } = req.body;
  
  // Cette route pourrait modifier dynamiquement l'interface
  // pour tester les capacités d'auto-healing de Testim
  
  res.json({ 
    success: true, 
    message: `UI change simulated: ${changeType}`,
    timestamp: new Date()
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur de démonstration Testim démarré sur http://localhost:${PORT}`);
  console.log(`📧 Email de test: user@example.com`);
  console.log(`🔑 Mot de passe: password123`);
});
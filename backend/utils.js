const jwt = require('jsonwebtoken');

// Middleware to verify the JWT from the cookie
const verifyToken = (req, res, next) => {
  //console.log("hiiii");
  // LOG 1: Announce that the middleware is running for a specific request path.
  console.log(`--- [VERIFY TOKEN] 1. Middleware running for: ${req.path}`);

  // Get the token from the cookie named "jwtToken". This is the most likely point of failure.
  const token = req.cookies.jwtToken;
  
  // LOG 2: Check if the token was found in the cookies.
  if (!token) {
    console.error("--- [VERIFY TOKEN] ❌ 2. FAILED: No 'jwtToken' cookie found.");
    return res.status(401).json({ message: "Unauthorized: No token provided." });
  }

  console.log("--- [VERIFY TOKEN] ✅ 2. SUCCESS: 'jwtToken' cookie found.");
  
  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    // LOG 3: Check the result of the verification.
    if (err) {
      console.error(`--- [VERIFY TOKEN] ❌ 3. FAILED: Token verification error: ${err.name}`);
      // Handle specific errors like expiration
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Unauthorized: Token has expired." });
      }
      return res.status(403).json({ message: "Forbidden: Invalid token." });
    }
    
    console.log("--- [VERIFY TOKEN] ✅ 3. SUCCESS: Token is valid.");
    
    // If token is valid, attach the decoded user info to the request object
    req.user = decoded;
    
    // LOG 4: Announce that we are proceeding to the main route handler.
    console.log("--- [VERIFY TOKEN] 4. Proceeding to the next handler...");
    
    // Proceed to the next middleware or the route handler
    next();
  });
};

// Your old isLoggedIn function might be here, it's fine to leave it.
const isLoggedIn = (req, res, next) => { /* ... */ };

module.exports = {
  verifyToken,
  isLoggedIn // Export both if you use both
};
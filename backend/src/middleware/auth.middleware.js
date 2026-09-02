const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Brak tokenu – zaloguj się" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "tajnykluczdozmiany"
    );
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Nieprawidłowy token" });
  }
};

module.exports = authMiddleware;

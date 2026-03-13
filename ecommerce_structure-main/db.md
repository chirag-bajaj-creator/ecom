Run this in your terminal:

  docker exec -it ecommerce-mongodb mongosh

  Then inside mongosh:

  use ecommerce
  db.users.find().pretty()

  This shows all users with name, email, phone, role etc. Password will show as a hashed
   string (bcrypt) — you won't see the plain text password, that's by design for        
  security.

  To exit mongosh, type exit.
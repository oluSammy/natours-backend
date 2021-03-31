const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('unhandledRejection', (err) => {
  console.log('Unhandled exception, shutting down');
  console.log(err.name, err.message, err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connection Successful');
  });

//START THE SERVER
const port = 3000 || process.env.PORT;

const server = app.listen(port, () => {
  console.log(`Server fired up on port ${port}`);
});

process.on('uncaughtException', (err) => {
  console.log('uncaught exception, shutting down');
  console.log(err.name, err.message, err);
  server.close(() => {
    process.exit(1);
  });
});

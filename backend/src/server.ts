import app from './app';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║      🚀 NEXUS API Server Running        ║
  ║      Port: ${String(PORT).padEnd(28)}║
  ║      Env:  ${String(process.env.NODE_ENV || 'development').padEnd(28)}║
  ╚══════════════════════════════════════════╝
  `);
});

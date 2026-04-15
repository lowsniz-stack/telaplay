const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }

  if (err.code === 'P2002') {
    return res.status(400).json({ error: 'Registro duplicado' });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Erro interno do servidor' });
}

module.exports = { errorHandler };

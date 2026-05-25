const { z } = require('zod');

const authSchema = z.object({
  usuario: z.string().min(1),
  contrasena: z.string().min(1)
});

const blockSchema = authSchema.extend({
  celhash: z.string().min(1)
});

const mineSchema = authSchema.extend({
  data: z.object({
    celhash: z.string().min(1)
  }).catchall(z.number().int()).superRefine((data, context) => {
    const voteKeys = Object.keys(data).filter((key) => /^voto\d+$/.test(key));
    if (voteKeys.length < 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe enviar al menos un voto (voto1, voto2, ...).'
      });
    }
  })
});

module.exports = {
  authSchema,
  blockSchema,
  mineSchema,
  txSchema: mineSchema
};

import multipart from '@fastify/multipart';
import fp from 'fastify-plugin';

type FileUploadsOptions = {
  maxFileSize: number;
  maxFiles: number;
};

// Parses multipart/form-data into request.body, with uploaded files as web File objects,
// so route schemas validate them like any other field. A single field is a File, a repeated one a File[].
// fastify-plugin applies it to the plugin that registers it (e.g. one module's routes), not just to itself.
export const fileUploads = fp<FileUploadsOptions>(async (app, { maxFileSize, maxFiles }) => {
  await app.register(multipart, {
    attachFieldsToBody: 'keyValues',
    limits: { fileSize: maxFileSize, files: maxFiles },
    onFile: async (part) => {
      const file = new File([new Uint8Array(await part.toBuffer())], part.filename, {
        type: part.mimetype,
      });
      Object.assign(part, { value: file });
    },
  });
});

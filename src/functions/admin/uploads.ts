import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createUploadSignature } from "@/server/cloudinary";
import { requireModule } from "@/server/session";
import { validate } from "@/server/validation";

export const getUploadSignature = createServerFn({ method: "POST" })
  .validator(validate(z.object({ carpeta: z.enum(["platillos", "promociones", "empresa"]) })))
  .handler(async ({ data }) => {
    await requireModule(data.carpeta);
    return createUploadSignature(data.carpeta);
  });

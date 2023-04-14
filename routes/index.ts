import { Router } from "https://deno.land/x/oak@v10.2.1/mod.ts";
import { mota } from "./mota.ts"

const router = new Router();

mota(router)

export default router
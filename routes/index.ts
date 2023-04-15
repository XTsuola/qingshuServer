import { Router } from "https://deno.land/x/oak@v10.2.1/mod.ts";
import { qingshu } from "./qingshu.ts"

const router = new Router();

qingshu(router)

export default router
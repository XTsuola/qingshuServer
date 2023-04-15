// deno-lint-ignore-file
import { Router } from "https://deno.land/x/oak@v10.2.1/router.ts";
import { helpers } from "https://deno.land/x/oak@v10.2.1/mod.ts";
import { queryOne, update } from "../mongoDB/index.ts";
import { Document } from "https://deno.land/x/mongo@v0.29.3/mod.ts";

export function qingshu(router: Router) {
  router
    .post("/qingshu/login", async (ctx): Promise<void> => { // 登录
      const params: any = await ctx.request.body({
        type: "json",
      }).value;
      const sql = { username: params.username };
      const data: Document | undefined = await queryOne(sql, "user");
      if (data) {
        if (data.password == params.password) {
          const data2 = {
            _id: data._id,
            id: data.id
          };
          ctx.response.body = {
            "code": 200,
            "data": data2,
            "msg": "登录成功",
          };
        } else {
          ctx.response.body = {
            "code": 0,
            "msg": "密码错误",
          };
        }
      } else {
        ctx.response.body = {
          "code": 0,
          "msg": "账号不存在",
        };
      }
    }).get("/qingshu/getCardPile", async (ctx): Promise<void> => { // 获取牌堆
      const arr = [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8]
      for (let i = 0; i < arr.length; i++) {
        let rand = Math.floor(Math.random() * arr.length)
        let sum = arr[rand]
        arr[rand] = arr[i]
        arr[i] = sum
      }
      let cardPile = arr.slice(5, arr.length)
      let disPile = arr.slice(0, 3)
      let userData = [{
        id: 1,
        handCards: arr.slice(3, 4),
        disCards: [],
        userName: "月色"
      }, {
        id: 2,
        handCards: arr.slice(4, 5),
        disCards: [],
        userName: "江南"
      }]
      const param1 = { id: 1 }
      const param2 = {
        round: 1,
        cardPile: cardPile,
        disPile: disPile,
        userData: userData
      }
      const res = await update(param1, param2, "gameData")
      if (res.modifiedCount == 1) {
        const data: Document | undefined = await queryOne({ id: 1 }, "gameData")
        ctx.response.body = {
          "code": 200,
          "rows": data,
          "msg": "获取成功",
        };
      } else {
        ctx.response.body = {
          "code": 500,
          "msg": "获取失败",
        };
      }
    }).get("/qingshu/mopai", async (ctx): Promise<void> => { // 摸牌
      const params: any = helpers.getQuery(ctx);
      const data: Document | undefined = await queryOne({ id: 1 }, "gameData")
      if(data?.userData.find((item:any) => item.id == params.id)) {
        data?.userData.find((item:any) => item.id == params.id).handCards.push(data?.cardPile[0])
      }
      const param1 = { id: 1 }
      const param2 = {
        cardPile: data?.cardPile.slice(1, data?.cardPile.length),
        userData: data?.userData
      }
      const res = await update(param1, param2, "gameData")
      ctx.response.body = {
        "code": 200,
        "msg": "操作成功",
      };
    }).get("/qingshu/getGameData", async (ctx): Promise<void> => { // 获取当前游戏信息
      const data: Document | undefined = await queryOne({ id: 1 }, "gameData")
      ctx.response.body = {
        "code": 200,
        "rows": data,
        "msg": "操作成功",
      };
    }).get("/qingshu/chupai", async (ctx): Promise<void> => { // 出牌
      console.log("出牌")
      const params: any = helpers.getQuery(ctx);
      const data: Document | undefined = await queryOne({ id: 1 }, "gameData")
      console.log(params.id, params.wz)
      if(data?.userData.find((item:any) => item.id == params.id)) {
        let qipai = []
        if(params.wz == 0) {
          qipai = data?.userData.find((item:any) => item.id == params.id).handCards.shift()
          console.log(qipai, "qipai")
        } else if(params.wz == 1) {
          qipai = data?.userData.find((item:any) => item.id == params.id).handCards.pop()
        }
        data?.userData.find((item:any) => item.id == params.id).disCards.push(qipai)
      }
      console.log(22222)
      const param1 = { id: 1 }
      const param2 = {
        cardPile: data?.cardPile.slice(1, data?.cardPile.length),
        userData: data?.userData
      }
      const res = await update(param1, param2, "gameData")
      ctx.response.body = {
        "code": 200,
        "msg": "操作成功",
      };
    })
}

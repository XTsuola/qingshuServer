// deno-lint-ignore-file
import { Router } from "https://deno.land/x/oak@v10.2.1/router.ts";
import { helpers } from "https://deno.land/x/oak@v10.2.1/mod.ts";
import { queryOne, update } from "../mongoDB/index.ts";
import { Document } from "https://deno.land/x/mongo@v0.29.3/mod.ts";

export function qingshu(router: Router) {
  router
    .post("/qingshu/login", async (ctx: any): Promise<void> => { // 登录
      const params: any = await ctx.request.body({
        type: "json",
      }).value;
      const sql = { username: params.username };
      const data: Document | undefined = await queryOne(sql, "user");
      if (data) {
        if (data.password == params.password) {
          const data2 = {
            _id: data._id,
            id: data.id,
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
    }).get("/qingshu/resetGame", async (ctx: any): Promise<void> => { // 重置整个游戏
      let userData = [{
        id: 1,
        handCards: [],
        disCards: [],
        userName: "月色",
        status: 0,
        preStatus: 1,
        winCount: 0,
      }, {
        id: 2,
        handCards: [],
        disCards: [],
        userName: "江南",
        status: 0,
        preStatus: 1,
        winCount: 0,
      }];
      const param1 = { id: 1 };
      const param2 = {
        status: 1,
        allRound: 1,
        nowRound: 1,
        cardPile: [],
        disPile: [],
        userData: userData,
      };
      const res = await update(param1, param2, "gameData");
      if (res.modifiedCount == 1) {
        const data: Document | undefined = await queryOne(
          { id: 1 },
          "gameData",
        );
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
    }).get("/qingshu/zhunbei", async (ctx: any): Promise<void> => { // 准备
      const params: any = helpers.getQuery(ctx);
      const data: Document | undefined = await queryOne({ id: 1 }, "gameData");
      if (data?.userData.find((item: any) => item.id == params.id)) {
        data.userData.find((item: any) => item.id == params.id).preStatus = 2;
      }
      let count = 0;
      for (let i = 0; i < data?.userData.length; i++) {
        if (data?.userData[i].preStatus == 2) {
          count++;
        }
      }
      if (count == data?.userData.length) {
        let loseId = 0;
        for (let i = 0; i < data.userData.length; i++) {
          if (data.userData[i].status == 3) {
            loseId = data.userData[i].id;
            break;
          }
        }
        const arr = [1, 1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8];
        for (let i = 0; i < arr.length; i++) {
          let rand = Math.floor(Math.random() * arr.length);
          let sum = arr[rand];
          arr[rand] = arr[i];
          arr[i] = sum;
        }
        // const arr = [1, 1, 1, 8, 8, 3, 8];
        let cardPile = arr.slice(5, arr.length);
        let disPile = arr.slice(0, 3);
        data.userData[0].handCards = arr.slice(3, 4);
        data.userData[0].disCards = [];
        data.userData[0].status = 0;
        data.userData[0].preStatus = 1;
        data.userData[1].handCards = arr.slice(4, 5);
        data.userData[1].disCards = [];
        data.userData[1].status = 0;
        data.userData[1].preStatus = 1;
        const param1 = { id: 1 };
        const param2 = {
          status: 2,
          allRound: 1,
          nowRound: loseId == 1 ? 2 : 1,
          cardPile: cardPile,
          disPile: disPile,
          userData: data?.userData,
        };
        const res = await update(param1, param2, "gameData");
        ctx.response.body = {
          "code": 200,
          "msg": "操作成功",
        };
      } else {
        const param1 = { id: 1 };
        const param2 = {
          status: data?.status,
          userData: data?.userData,
        };
        const res = await update(param1, param2, "gameData");
        ctx.response.body = {
          "code": 200,
          "msg": "操作成功",
        };
      }
    }).get("/qingshu/mopai", async (ctx: any): Promise<void> => { // 摸牌
      const params: any = helpers.getQuery(ctx);
      const data: Document | undefined = await queryOne({ id: 1 }, "gameData");
      if (data?.userData.find((item: any) => item.id == params.id)) {
        data?.userData.find((item: any) => item.id == params.id).handCards.push(
          data?.cardPile[0],
        );
        data.userData.find((item: any) => item.id == params.id).status = 0;
      }
      const param1 = { id: 1 };
      const param2 = {
        cardPile: data?.cardPile.slice(1, data?.cardPile.length),
        userData: data?.userData,
      };
      const res = await update(param1, param2, "gameData");
      ctx.response.body = {
        "code": 200,
        "msg": "操作成功",
      };
    }).get("/qingshu/getGameData", async (ctx: any): Promise<void> => { // 获取当前游戏信息
      const data: Document | undefined = await queryOne({ id: 1 }, "gameData");
      ctx.response.body = {
        "code": 200,
        "rows": data,
        "msg": "操作成功",
      };
    }).get("/qingshu/chupai", async (ctx: any): Promise<void> => { // 出牌
      const params: any = helpers.getQuery(ctx);
      const data: Document | undefined = await queryOne({ id: 1 }, "gameData");
      // console.log(params.id, params.wz, params.tid, params.ypai, params.tpai);
      if (data?.userData.find((item: any) => item.id == params.id)) {
        let qipai = [];
        if (params.wz == 0) {
          qipai = data?.userData.find((item: any) => item.id == params.id)
            .handCards.shift();
        } else if (params.wz == 1) {
          qipai = data?.userData.find((item: any) => item.id == params.id)
            .handCards.pop();
        }
        data?.userData.find((item: any) => item.id == params.id).disCards.push(
          qipai,
        );
      }
      if (params.ypai == 1) {
        if (data?.userData.find((item: any) => item.id == params.id)) {
          if (
            data.userData.find((item: any) => item.id == params.tid).status != 1
          ) {
            const nTPai = data.userData.find((item: any) =>
              item.id == params.tid
            ).handCards[0];
            if (params.tpai == nTPai) {
              data.userData.find((item: any) => item.id == params.tid)
                .handCards = [];
              data.userData.find((item: any) => item.id == params.tid).disCards
                .push(nTPai);
              data.userData.find((item: any) => item.id == params.tid)
                .status = 3;
              data.userData.find((item: any) => item.id == params.id)
                .winCount += 1;
              data.status = 1;
            }
          }
        }
      }
      if (params.ypai == 3) {
        if (data?.userData.find((item: any) => item.id == params.id)) {
          if (
            data.userData.find((item: any) => item.id == params.tid).status != 1
          ) {
            const nPai = data.userData.find((item: any) =>
              item.id == params.id
            ).handCards[0];
            const nTPai = data.userData.find((item: any) =>
              item.id == params.tid
            ).handCards[0];
            if (nPai > nTPai || nPai < nTPai) {
              data.userData.find((item: any) => item.id == params.id)
                .handCards = [];
              data.userData.find((item: any) => item.id == params.tid)
                .handCards = [];
              data.userData.find((item: any) => item.id == params.id).disCards
                .push(nPai);
              data.userData.find((item: any) => item.id == params.tid).disCards
                .push(nTPai);
              if (nPai < nTPai) {
                data.userData.find((item: any) => item.id == params.id).status =
                  3;
                data.userData.find((item: any) => item.id == params.tid)
                  .winCount += 1;
              } else {
                data.userData.find((item: any) => item.id == params.tid)
                  .status = 3;
                data.userData.find((item: any) => item.id == params.id)
                  .winCount += 1;
              }
              data.status = 1;
            }
          }
        }
      }
      if (params.ypai == 4) {
        if (data?.userData.find((item: any) => item.id == params.id)) {
          data.userData.find((item: any) => item.id == params.id).status = 1;
        }
      } else if (params.ypai == 5) {
        if (data?.userData.find((item: any) => item.id == params.tid)) {
          if (
            data.userData.find((item: any) => item.id == params.tid).status != 1
          ) {
            const oldPai = data.userData.find((item: any) =>
              item.id == params.tid
            ).handCards[0];
            if (oldPai == 8) {
              data.userData.find((item: any) => item.id == params.tid)
                .handCards = [];
              data.userData.find((item: any) => item.id == params.tid).disCards
                .push(oldPai);
              data.userData.find((item: any) => item.id == params.tid).status =
                3;
              data.userData.find((item: any) => item.id == params.id)
                .winCount += 1;
              data.status = 1;
            } else {
              let newPai = 0;
              if (data.cardPile.length == 0) {
                newPai = data.disPile[0];
              } else {
                newPai = data.cardPile[0];
                data.cardPile = data.cardPile.slice(1, data?.cardPile.length);
              }
              data.userData.find((item: any) => item.id == params.tid).disCards
                .push(oldPai);
              data.userData.find((item: any) => item.id == params.tid).handCards
                .splice(0, 1, newPai);
            }
          }
        }
      } else if (params.ypai == 6) {
        if (data?.userData.find((item: any) => item.id == params.tid)) {
          if (
            data.userData.find((item: any) => item.id == params.tid).status != 1
          ) {
            let cpai = 0;
            cpai = data.userData.find((item: any) => item.id == params.id)
              .handCards.pop();
            data.userData.find((item: any) => item.id == params.id).handCards
              .push(
                data.userData.find((item: any) => item.id == params.tid)
                  .handCards.pop(),
              );
            data.userData.find((item: any) => item.id == params.tid).handCards
              .push(cpai);
          }
        }
      } else if (params.ypai == 8) {
        if (data?.userData.find((item: any) => item.id == params.id)) {
          data.userData.find((item: any) => item.id == params.id).disCards.push(
            data.userData.find((item: any) => item.id == params.id)
              .handCards[0],
          );
          data.userData.find((item: any) => item.id == params.id).handCards =
            [];
          data.userData.find((item: any) => item.id == params.id).status = 3;
          data.userData.find((item: any) => item.id == params.tid)
            .winCount += 1;
          data.status = 1;
        }
      }
      if (data?.cardPile.length == 0) { // 最后比大小
        const nPai = data.userData.find((item: any) =>
            item.id == params.id
          ).handCards.length > 0
          ? data.userData.find((item: any) => item.id == params.id).handCards[0]
          : undefined;
        const nTPai = data.userData.find((item: any) =>
            item.id == params.tid
          ).handCards.length > 0
          ? data.userData.find((item: any) =>
            item.id == params.tid
          ).handCards[0]
          : undefined;
        if (nPai && nTPai) {
          if (nPai > nTPai || nPai < nTPai) {
            data.userData.find((item: any) => item.id == params.id)
              .handCards = [];
            data.userData.find((item: any) => item.id == params.tid)
              .handCards = [];
            data.userData.find((item: any) => item.id == params.id).disCards
              .push(nPai);
            data.userData.find((item: any) => item.id == params.tid).disCards
              .push(nTPai);
            if (nPai < nTPai) {
              data.userData.find((item: any) => item.id == params.id).status =
                3;
              data.userData.find((item: any) => item.id == params.tid)
                .winCount += 1;
            } else {
              data.userData.find((item: any) => item.id == params.tid)
                .status = 3;
              data.userData.find((item: any) => item.id == params.id)
                .winCount += 1;
            }
            data.status = 1;
          }
        }
      }
      const param1 = { id: 1 };
      const param2 = {
        cardPile: data?.cardPile,
        userData: data?.userData,
        nowRound: data?.nowRound == 1 ? 2 : 1,
        status: data?.status,
      };
      const res = await update(param1, param2, "gameData");
      ctx.response.body = {
        "code": 200,
        "msg": "操作成功",
      };
    });
}

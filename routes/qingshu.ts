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
      let userData: any = [];
      const param1 = { id: 1 };
      const param2 = {
        status: 0,
        allRound: 1,
        nowRound: 1,
        cardPile: [],
        disPile: [],
        userData: userData,
        waitArea: [1, 2, 3, 4],
        preArea: [0, 0, 0, 0],
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
    }).get("/qingshu/selectChair", async (ctx: any): Promise<void> => { // 选择椅子
      const params: any = helpers.getQuery(ctx);
      const data: Document | undefined = await queryOne({ id: 1 }, "gameData");
      const ind = data?.waitArea.findIndex((item: any) => item == params.id);
      if (data && ind != -1) {
        data.waitArea.splice(ind, 1);
        data.preArea[params.num - 1] = parseInt(params.id);
      }
      const ind2 = data?.preArea.findIndex((item: any) => item == params.id);
      if (data && ind2 != -1 && data.preArea[params.num - 1] == 0) {
        data.preArea[ind2] = 0;
        data.preArea[params.num - 1] = parseInt(params.id);
      }
      const param1 = { id: 1 };
      const param2 = {
        waitArea: data?.waitArea,
        preArea: data?.preArea,
      };
      const res = await update(param1, param2, "gameData");
      ctx.response.body = {
        "code": 200,
        "msg": "操作成功",
      };
    }).get("/qingshu/goTree", async (ctx: any): Promise<void> => { // 回到等待区
      const params: any = helpers.getQuery(ctx);
      const data: Document | undefined = await queryOne({ id: 1 }, "gameData");
      const ind = data?.preArea.findIndex((item: any) => item == params.id);
      if (data && ind != -1) {
        data.preArea.splice(ind, 1, 0);
        data.waitArea.push(params.id);
      }
      const param1 = { id: 1 };
      const param2 = {
        waitArea: data?.waitArea,
        preArea: data?.preArea,
      };
      const res = await update(param1, param2, "gameData");
      ctx.response.body = {
        "code": 200,
        "msg": "操作成功",
      };
    }).get("/qingshu/goRoom", async (ctx: any): Promise<void> => { // 进入房间
      const data: Document | undefined = await queryOne({ id: 1 }, "gameData");
      const list = data?.preArea.filter((item: any) => item != 0);
      let nameList = ["月色", "江南", "鹿鸣", "湛雨"];
      let userData: any = [];
      for (let i = 0; i < list.length; i++) {
        userData.push({
          id: i + 1,
          handCards: [],
          disCards: [],
          userId: list[i],
          userName: nameList[list[i] - 1],
          status: 0,
          preStatus: 1,
          winCount: 0,
        });
      }
      const param1 = { id: 1 };
      const param2 = {
        status: 1,
        userData: userData,
      };
      const res = await update(param1, param2, "gameData");
      ctx.response.body = {
        "code": 200,
        "msg": "操作成功",
      };
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
        let winId = 0;
        for (let i = 0; i < data.userData.length; i++) {
          if (data.userData[i].status == 6) {
            winId = data.userData[i].id;
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
        // const arr = [8, 4, 1, 4, 8, 2, 5, 1, 4, 2, 1];
        let cardPile;
        let disPile;
        if (data.userData.length == 2) {
          cardPile = arr.slice(5, arr.length);
          disPile = arr.slice(0, 3);
          data.userData[0].handCards = arr.slice(3, 4);
          data.userData[1].handCards = arr.slice(4, 5);
        } else if (data.userData.length == 3) {
          cardPile = arr.slice(6, arr.length);
          disPile = arr.slice(0, 3);
          data.userData[0].handCards = arr.slice(3, 4);
          data.userData[1].handCards = arr.slice(4, 5);
          data.userData[2].handCards = arr.slice(5, 6);
        } else if (data.userData.length == 4) {
          cardPile = arr.slice(5, arr.length);
          disPile = arr.slice(0, 1);
          data.userData[0].handCards = arr.slice(1, 2);
          data.userData[1].handCards = arr.slice(2, 3);
          data.userData[2].handCards = arr.slice(3, 4);
          data.userData[3].handCards = arr.slice(4, 5);
        }
        for (let i = 0; i < data.userData.length; i++) {
          data.userData[i].disCards = [];
          data.userData[i].status = 0;
          data.userData[i].preStatus = 1;
        }
        const param1 = { id: 1 };
        const param2 = {
          status: 2,
          allRound: 1,
          nowRound: winId != 0 ? winId : 1,
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
      const startRoundList = (data?.userData.filter((item: any) => {
        item.status != 3;
      })).map((item: any) => {
        return item.id;
      });
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
              if (nPai < nTPai) {
                data.userData.find((item: any) => item.id == params.id)
                  .handCards = [];
                data.userData.find((item: any) => item.id == params.id).disCards
                  .push(nPai);
                data.userData.find((item: any) => item.id == params.id).status =
                  3;
              } else {
                data.userData.find((item: any) => item.id == params.tid)
                  .handCards = [];
                data.userData.find((item: any) => item.id == params.tid)
                  .disCards
                  .push(nTPai);
                data.userData.find((item: any) => item.id == params.tid)
                  .status = 3;
              }
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
            } else {
              let newPai = 0;
              if (data.cardPile.length == 0) {
                newPai = data.disPile[0];
                data.disPile = data.disPile.slice(1, data.disPile.length)
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
        }
      }
      let over = false;
      if (data?.cardPile.length == 0) { // 最后比大小
        over = true;
        let loseCount = 0;
        for (let i = 0; i < data?.userData.length; i++) {
          if (data?.userData[i].status == 3) {
            loseCount++;
          }
        }
        data.status = 1;
        if (data && loseCount == data.userData.length - 1) {
          for (let i = 0; i < data.userData.length; i++) {
            if (data.userData[i].status != 3) {
              let disNowId = data.userData[i].handCards[0];
              data.userData[i].disCards.push(disNowId);
              data.userData[i].handCards = [];
              data.userData[i].status = 6;
              data.userData[i].winCount += 1;
            }
          }
        } else {
          const scoreList = data.userData.map((item: any) => item.handCards[0]);
          const result = scoreList.sort((a: number, b: number) => {
            return b - a;
          })[0];
          for (let i = 0; i < data.userData.length; i++) {
            if (data.userData[i].handCards[0]) {
              if (data.userData[i].handCards[0] == result) {
                let disNowId = data.userData[i].handCards[0];
                data.userData[i].disCards.push(disNowId);
                data.userData[i].handCards = [];
                data.userData[i].status = 6;
                data.userData[i].winCount += 1;
              } else {
                let disNowId = data.userData[i].handCards[0];
                data.userData[i].disCards.push(disNowId);
                data.userData[i].handCards = [];
                data.userData[i].status = 3;
              }
            }
          }
        }
      }
      if (!over) {
        let loseCount = 0;
        for (let i = 0; i < data?.userData.length; i++) {
          if (data?.userData[i].status == 3) {
            loseCount++;
          }
        }
        if (data && loseCount == data.userData.length - 1) {
          data.status = 1;
          for (let i = 0; i < data.userData.length; i++) {
            if (data.userData[i].status != 3) {
              let disNowId = data.userData[i].handCards[0];
              data.userData[i].disCards.push(disNowId);
              data.userData[i].handCards = [];
              data.userData[i].status = 6;
              data.userData[i].winCount += 1;
            }
          }
        }
      }
      let nowRound = data?.nowRound;
      const roundList = (data?.userData.filter((item: any) => item.status != 3))
        .map((item: any) => {
          return item.id;
        });
      const ind = roundList.findIndex((item: number) => item == data?.nowRound);
      if (ind == -1) {
        const index = startRoundList.findIndex((item: number) =>
          item == data?.nowRound
        );
        nowRound = startRoundList[index + 1]
          ? startRoundList[index + 1]
          : startRoundList[0];
      } else {
        nowRound = roundList[ind + 1] ? roundList[ind + 1] : roundList[0];
      }
      const param1 = { id: 1 };
      const param2 = {
        cardPile: data?.cardPile,
        disPile: data?.disPile,
        userData: data?.userData,
        nowRound: nowRound,
        status: data?.status,
      };
      const res = await update(param1, param2, "gameData");
      ctx.response.body = {
        "code": 200,
        "msg": "操作成功",
      };
    });
}

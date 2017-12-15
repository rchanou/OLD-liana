const assert = require("assert");
const { types } = require("mobx-state-tree");

const User = types.model("User", {
  name: types.string
});

const Shop = types.model("Page", {
  user: User,
  page: types.number
});

const Game = types.model("Game", {
  user: User,
  level: types.number
});

const ShopGame = types.compose("ShopGame", Shop, Game);

window.g = ShopGame.create({ user: { name: "al" }, page: 0, level: 1 });

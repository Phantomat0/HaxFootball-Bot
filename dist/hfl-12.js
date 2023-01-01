var t = "HAXFOOTBALL",
  MAX_PLAYERS = 15,
  redScore = 0,
  blueScore = 0,
  redName = "Red: ",
  blueName = "Blue: ",
  redColor = 0xFF0000,
  blueColor = 0x0000FF,
  kicker = 0,
  kickDistance = 0,
  hike = !1,
  redZonePenalty = 0,
  redZoneSpot = 0,
  redZoneCheck = 0,
  fgCall = 0,
  delay = 0,
  playDead = 0,
  n = !0,
  ballAvatar = String.fromCodePoint(127944),
  r = ballAvatar + " " + t + " " + ballAvatar,
  o = "HFL Ref",
  l = String.fromCodePoint(127939),
  d = String.fromCodePoint(128276),
  y = String.fromCodePoint(9940),
  s = String.fromCodePoint(10060),
  c = String.fromCodePoint(10004),
  v = String.fromCodePoint(127795),
  u = String.fromCodePoint(128222),
  z = String.fromCodePoint(128170),
  sk = String.fromCodePoint(128293),
  wl = String.fromCodePoint(10060),
  clown = String.fromCodePoint(129313),
  dizzy = String.fromCodePoint(128171),
  comet = String.fromCodePoint(127776),
  otter = String.fromCodePoint(129446),
  trident = String.fromCodePoint(128305),
  eyes = String.fromCodePoint(128064),
  poo = String.fromCodePoint(128169),
  x = 1150,
  f = 600,
  m = -266,
  p = 266,
  h = 930,
  g = -930,
  b = 8.5,
  C = 300,
  B = 510,
  O = 15.5,
  P = -459,
  k = 266,
  T = 15,
  A = 1,
  D = 0,
  L = new Map,
  F = new Map,
  S = [],
  I = [],
  w = 930,
  G = 60,
  R = !0,
  M = !1,
  E = 1,
  N = !1,
  U = b + T + .01,
  W = 2 * T + .01,
  Q = x - b / 2 + 6,
  H = b;
x += b / 2 + 6, f += b / 2 + 6;
var K, Y, j, _, X, Z, q, z, V, J, $, tt, nt, et = new Date,
  it = {
    SPECTATORS: 0,
    RED: 1,
    BLUE: 2
  },
  pb = 0,
  at = !1,
  rt = !1,
  ot = !1,
  lt = !1,
  dt = 0,
  yt = 20,
  st = !1,
  ct = !1,
  vt = !1,
  ut = !1,
  xt = 2,
  ft = 0,
  mt = 0,
  pt = null,
  ht = "",
  gt = "",
  bt = "",
  Ct = 43,
  Bt = -89,
  Ot = !1,
  Pt = !1,
  kt = !1,
  Tt = !1,
  At = [{
    name: "temp",
    times: 0
  }],
  Dt = !1,
  Lt = 0,
  Ft = 0,
  St = 0,
  It = !1,
  wt = !1,
  Gt = !1,
  Rt = !1,
  Mt = !1,
  Et = !1,
  Nt = !1,
  Ut = !1,
  Wt = !1,
  Qt = !1,
  Ht = !1,
  Kt = 0,
  Yt = "",
  jt = 75,
  _t = 0,
  Xt = 0,
  Zt = 0,
  qt = 0,
  zt = !0,
  Vt = 120,
  Jt = 240,
  $t = 596994756,
  tn = "",
  nn = 0,
  en = 0,
  an = 0,
  rn = !1,
  on = !1,
  ln = 0,
  dn = 155926656e4,
  yn = 0,
  sn = 0,
  cn = 0,
  vn = 0,
  un = 0,
  xn = [],
  fn = [],
  mn = et,
  crowdID = 1,
  InterceptionID = 0,
  intDown = 0,
  intSpot = 0,
  intOut = 0,
  intTackle = 0,
  intTime = 0,
  pn = HBInit({
    // Remove the "//" before password to set a password
    // password: "trash2",
    roomName: r,
    maxPlayers: MAX_PLAYERS,
    public: true,
    playerName: o,
    geo: {
      code: "US",
      lat: Ct,
      lon: Bt
    }
  });
pn.setScoreLimit(0), pn.setTimeLimit(13);
var hn = '{\n\n\t\t"name" : "Season 12 HFL Official",\n\t\t\n\t\t"cameraFollow" : "ball",\n\n\t\t"width" : 1090,\n\n\t\t"height" : 380,\n\n\t\t"spawnDistance" : 980,\n\n\t\t"bg" : { "type" : "grass", "width" : 930, "height" : 266, "kickOffRadius" : 0, "cornerRadius" : 0, "goalLine" : 0 },\n\n\t\t"vertexes" : [\n\t\t\t/* 0 */ { "x" : 0, "y" : 75, "trait" : "kickOffBarrier" },\n\t\t\t/* 1 */ { "x" : 0, "y" : -75, "trait" : "kickOffBarrier" },\n\t\t\t/* 2 */ { "x" : 0, "y" : -330, "trait" : "kickOffBarrier" },\n\t\t\t\n\t\t\t/* 3 */ { "x" : -775, "y" : -266, "trait" : "goalline" },\n\t\t\t/* 4 */ { "x" : -775, "y" : 266, "trait" : "goalline" },\n\t\t\t\n\t\t\t/* 5 */ { "x" : -620, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 6 */ { "x" : -620, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 7 */ { "x" : -462, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 8 */ { "x" : -462, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 9 */ { "x" : -310, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 10 */ { "x" : -310, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 11 */ { "x" : -155, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 12 */ { "x" : -155, "y" : 266, "trait" : "yardline" },\n\t\t\t\n\t\t\t/* 13 */ { "x" : 0, "y" : -266, "trait" : "centerline" },\n\t\t\t/* 14 */ { "x" : 0, "y" : 266, "trait" : "centerline" },\n\t\t\t\n\t\t\t/* 15 */ { "x" : 155, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 16 */ { "x" : 155, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 17 */ { "x" : 310, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 18 */ { "x" : 310, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 19 */ { "x" : 462, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 20 */ { "x" : 462, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 21 */ { "x" : 620, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 22 */ { "x" : 620, "y" : 266, "trait" : "yardline" },\n\t\t\t\n\t\t\t/* 23 */ { "x" : 775, "y" : -266, "trait" : "goalline" },\n\t\t\t/* 24 */ { "x" : 775, "y" : 266, "trait" : "goalline" },\n\t\t\t\n\t\t\t/* 25 */ { "x" : -1005, "y" : 25, "trait" : "goal" },\n\t\t\t/* 26 */ { "x" : -1005, "y" : -25, "trait" : "goal" },\n\t\t\t/* 27 */ { "x" : 1005, "y" : 25, "trait" : "goal" },\n\t\t\t/* 28 */ { "x" : 1005, "y" : -25, "trait" : "goal" },\n\t\t\t\n\t\t\t/* 29 */ { "x" : -775, "y" : -375, "trait" : "goalline" },\n\t\t\t/* 30 */ { "x" : -775, "y" : 375, "trait" : "goalline" },\n\t\t\t/* 31 */ { "x" : 775, "y" : -375, "trait" : "goalline" },\n\t\t\t/* 32 */ { "x" : 775, "y" : 375, "trait" : "goalline", "_selected" : true },\n\t\t\t\n\t\t\t/* 33 */ { "x" : -713, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 34 */ { "x" : -713, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 35 */ { "x" : -744, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 36 */ { "x" : -744, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 37 */ { "x" : -744, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 38 */ { "x" : -744, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 39 */ { "x" : -713, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 40 */ { "x" : -713, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 41 */ { "x" : 713, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 42 */ { "x" : 713, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 43 */ { "x" : 62, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 44 */ { "x" : 62, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 45 */ { "x" : 31, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 46 */ { "x" : 31, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 47 */ { "x" : -93, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 48 */ { "x" : -93, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 49 */ { "x" : -124, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 50 */ { "x" : -124, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 51 */ { "x" : -248, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 52 */ { "x" : -248, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 53 */ { "x" : -279, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 54 */ { "x" : -279, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 55 */ { "x" : -403, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 56 */ { "x" : -403, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 57 */ { "x" : -434, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 58 */ { "x" : -434, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 59 */ { "x" : -558, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 60 */ { "x" : -558, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 61 */ { "x" : -589, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 62 */ { "x" : -589, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 63 */ { "x" : 186, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 64 */ { "x" : 186, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 65 */ { "x" : 62, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 66 */ { "x" : 62, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 67 */ { "x" : 31, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 68 */ { "x" : 31, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 69 */ { "x" : -93, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 70 */ { "x" : -93, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 71 */ { "x" : -124, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 72 */ { "x" : -124, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 73 */ { "x" : -248, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 74 */ { "x" : -248, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 75 */ { "x" : -279, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 76 */ { "x" : -279, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 77 */ { "x" : -403, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 78 */ { "x" : -403, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 79 */ { "x" : -434, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 80 */ { "x" : -434, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 81 */ { "x" : -558, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 82 */ { "x" : -558, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 83 */ { "x" : -589, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 84 */ { "x" : -589, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 85 */ { "x" : 186, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 86 */ { "x" : 186, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 87 */ { "x" : 651, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 88 */ { "x" : 651, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 89 */ { "x" : 651, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 90 */ { "x" : 651, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 91 */ { "x" : 682, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 92 */ { "x" : 682, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 93 */ { "x" : 682, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 94 */ { "x" : 682, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 95 */ { "x" : 527, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 96 */ { "x" : 527, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 97 */ { "x" : 527, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 98 */ { "x" : 527, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 99 */ { "x" : 496, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 100 */ { "x" : 496, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 101 */ { "x" : 496, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 102 */ { "x" : 496, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 103 */ { "x" : 372, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 104 */ { "x" : 372, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 105 */ { "x" : 403, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 106 */ { "x" : 403, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 107 */ { "x" : 372, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 108 */ { "x" : 372, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 109 */ { "x" : 341, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 110 */ { "x" : 341, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 111 */ { "x" : 217, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 112 */ { "x" : 217, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 113 */ { "x" : 217, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 114 */ { "x" : 217, "y" : 60, "trait" : "yardline" },\n\t\t\t\n\t\t\t/* 115 */ { "x" : 1005, "y" : 25, "trait" : "goal" },\n\t\t\t/* 116 */ { "x" : 1005, "y" : -25, "trait" : "goal" },\n\t\t\t\n\t\t\t/* 117 */ { "x" : -682, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 118 */ { "x" : -682, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 119 */ { "x" : -682, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 120 */ { "x" : -682, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 121 */ { "x" : -651, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 122 */ { "x" : -651, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 123 */ { "x" : -651, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 124 */ { "x" : -651, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 125 */ { "x" : -527, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 126 */ { "x" : -527, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 127 */ { "x" : -527, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 128 */ { "x" : -527, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 129 */ { "x" : -496, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 130 */ { "x" : -496, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 131 */ { "x" : -496, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 132 */ { "x" : -496, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 133 */ { "x" : -372, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 134 */ { "x" : -372, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 135 */ { "x" : -372, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 136 */ { "x" : -372, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 137 */ { "x" : -341, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 138 */ { "x" : -341, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 139 */ { "x" : -341, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 140 */ { "x" : -341, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 141 */ { "x" : -217, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 142 */ { "x" : -217, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 143 */ { "x" : -186, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 144 */ { "x" : -186, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 145 */ { "x" : -217, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 146 */ { "x" : -217, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 147 */ { "x" : -186, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 148 */ { "x" : -186, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 149 */ { "x" : -62, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 150 */ { "x" : -62, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 151 */ { "x" : -31, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 152 */ { "x" : -31, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 153 */ { "x" : -62, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 154 */ { "x" : -62, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 155 */ { "x" : -31, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 156 */ { "x" : -31, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 157 */ { "x" : 93, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 158 */ { "x" : 93, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 159 */ { "x" : 93, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 160 */ { "x" : 93, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 161 */ { "x" : 124, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 162 */ { "x" : 124, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 163 */ { "x" : 124, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 164 */ { "x" : 124, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 165 */ { "x" : 248, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 166 */ { "x" : 248, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 167 */ { "x" : 248, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 168 */ { "x" : 248, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 169 */ { "x" : 279, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 170 */ { "x" : 279, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 171 */ { "x" : 279, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 172 */ { "x" : 279, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 173 */ { "x" : 341, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 174 */ { "x" : 341, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 175 */ { "x" : 403, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 176 */ { "x" : 403, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 177 */ { "x" : 434, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 178 */ { "x" : 434, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 179 */ { "x" : 434, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 180 */ { "x" : 434, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 181 */ { "x" : 558, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 182 */ { "x" : 558, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 183 */ { "x" : 558, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 184 */ { "x" : 558, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 185 */ { "x" : 589, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 186 */ { "x" : 589, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 187 */ { "x" : 589, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 188 */ { "x" : 589, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 189 */ { "x" : 713, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 190 */ { "x" : 713, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 191 */ { "x" : 744, "y" : -60, "trait" : "yardline" },\n\t\t\t/* 192 */ { "x" : 744, "y" : -80, "trait" : "yardline" },\n\t\t\t/* 193 */ { "x" : 744, "y" : 80, "trait" : "yardline" },\n\t\t\t/* 194 */ { "x" : 744, "y" : 60, "trait" : "yardline" },\n\t\t\t/* 195 */ { "x" : -465, "y" : -266, "trait" : "yardline", "color" : "BA0101" },\n\t\t\t/* 196 */ { "x" : -465, "y" : 266, "trait" : "yardline", "color" : "BA0101" },\n\t\t\t/* 197 */ { "x" : -459, "y" : -266, "trait" : "yardline", "color" : "BA0101" },\n\t\t\t/* 198 */ { "x" : -459, "y" : 266, "trait" : "yardline", "color" : "BA0101" },\n\t\t\t/* 199 */ { "x" : 459, "y" : -266, "trait" : "yardline", "color" : "BA0101" },\n\t\t\t/* 200 */ { "x" : 459, "y" : 266, "trait" : "yardline", "color" : "BA0101" },\n\t\t\t/* 201 */ { "x" : 465, "y" : -266, "trait" : "yardline", "color" : "BA0101" },\n\t\t\t/* 202 */ { "x" : 465, "y" : 266, "trait" : "yardline", "color" : "BA0101" },\n\t\t\t/* 203 */ { "x" : -697.5, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 204 */ { "x" : -697.5, "y" : 246, "trait" : "yardline" },\n\t\t\t/* 205 */ { "x" : -542.5, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 206 */ { "x" : -542.5, "y" : 246, "trait" : "yardline" },\n\t\t\t/* 207 */ { "x" : -387.5, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 208 */ { "x" : -387.5, "y" : 246, "trait" : "yardline" },\n\t\t\t/* 209 */ { "x" : -232.5, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 210 */ { "x" : -232.5, "y" : 246, "trait" : "yardline" },\n\t\t\t/* 211 */ { "x" : -77.5, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 212 */ { "x" : -77.5, "y" : 246, "trait" : "yardline" },\n\t\t\t/* 213 */ { "x" : 77.5, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 214 */ { "x" : 77.5, "y" : 246, "trait" : "yardline" },\n\t\t\t/* 215 */ { "x" : 232.5, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 216 */ { "x" : 232.5, "y" : 246, "trait" : "yardline" },\n\t\t\t/* 217 */ { "x" : 387.5, "y" : 266, "trait" : "yardline" },\n\t\t\t/* 218 */ { "x" : 387.5, "y" : 246, "trait" : "yardline" },\n\t\t\t/* 219 */ { "x" : 387.5, "y" : -246, "trait" : "yardline" },\n\t\t\t/* 220 */ { "x" : 387.5, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 221 */ { "x" : 232.5, "y" : -246, "trait" : "yardline" },\n\t\t\t/* 222 */ { "x" : 232.5, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 223 */ { "x" : 77.5, "y" : -246, "trait" : "yardline" },\n\t\t\t/* 224 */ { "x" : 77.5, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 225 */ { "x" : 542.5, "y" : -246, "trait" : "yardline" },\n\t\t\t/* 226 */ { "x" : 542.5, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 227 */ { "x" : 697.5, "y" : -246, "trait" : "yardline" },\n\t\t\t/* 228 */ { "x" : 697.5, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 229 */ { "x" : -77.5, "y" : -246, "trait" : "yardline" },\n\t\t\t/* 230 */ { "x" : -77.5, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 231 */ { "x" : -232.5, "y" : -246, "trait" : "yardline" },\n\t\t\t/* 232 */ { "x" : -232.5, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 233 */ { "x" : -387.5, "y" : -246, "trait" : "yardline" },\n\t\t\t/* 234 */ { "x" : -387.5, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 235 */ { "x" : -542.5, "y" : -246, "trait" : "yardline" },\n\t\t\t/* 236 */ { "x" : -542.5, "y" : -266, "trait" : "yardline" },\n\t\t\t/* 237 */ { "x" : -697.5, "y" : -246, "trait" : "yardline" },\n\t\t\t/* 238 */ { "x" : -697.5, "y" : -266, "trait" : "yardline" }\n\n\t\t],\n\n\t\t"segments" : [\n\t\t\t{ "v0" : 1, "v1" : 2, "trait" : "kickOffBarrier" },\n\t\t\t\n\t\t\t{ "v0" : 3, "v1" : 4, "trait" : "goalline", "x" : -775 },\n\t\t\t\n\t\t\t{ "v0" : 5, "v1" : 6, "trait" : "yardline", "x" : -620 },\n\t\t\t{ "v0" : 7, "v1" : 8, "trait" : "yardline", "x" : -462 },\n\t\t\t{ "v0" : 9, "v1" : 10, "trait" : "yardline", "x" : -310 },\n\t\t\t{ "v0" : 11, "v1" : 12, "trait" : "yardline", "x" : -155 },\n\t\t\t\n\t\t\t{ "v0" : 13, "v1" : 14, "trait" : "centerline" },\n\t\t\t\n\t\t\t{ "v0" : 15, "v1" : 16, "trait" : "yardline", "x" : 155 },\n\t\t\t{ "v0" : 17, "v1" : 18, "trait" : "yardline", "x" : 310 },\n\t\t\t{ "v0" : 19, "v1" : 20, "trait" : "yardline", "x" : 462 },\n\t\t\t{ "v0" : 21, "v1" : 22, "trait" : "yardline", "x" : 620 },\n\t\t\t\n\t\t\t{ "v0" : 23, "v1" : 24, "trait" : "goalline", "x" : 775 },\n\t\t\t\n\t\t\t{ "v0" : 25, "v1" : 26, "color" : "0000FF", "trait" : "goal", "x" : -1005 },\n\t\t\t{ "v0" : 27, "v1" : 28, "color" : "FF0000", "trait" : "goal", "x" : 1005 },\n\t\t\t\n\t\t\t{ "v0" : 29, "v1" : 30, "cGroup" : ["blueKO" ], "trait" : "kickOffBarrier", "x" : -775 },\n\t\t\t{ "v0" : 31, "v1" : 32, "cGroup" : ["redKO" ], "trait" : "kickOffBarrier", "x" : 775 },\n\t\t\t\n\t\t\t{ "v0" : 33, "v1" : 34, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -713 },\n\t\t\t{ "v0" : 35, "v1" : 36, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -744 },\n\t\t\t{ "v0" : 37, "v1" : 38, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -744 },\n\t\t\t{ "v0" : 39, "v1" : 40, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -713 },\n\t\t\t{ "v0" : 41, "v1" : 42, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 713 },\n\t\t\t{ "v0" : 43, "v1" : 44, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 62 },\n\t\t\t{ "v0" : 45, "v1" : 46, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 31 },\n\t\t\t{ "v0" : 47, "v1" : 48, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -93 },\n\t\t\t{ "v0" : 49, "v1" : 50, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -124 },\n\t\t\t{ "v0" : 51, "v1" : 52, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -248 },\n\t\t\t{ "v0" : 53, "v1" : 54, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -279 },\n\t\t\t{ "v0" : 55, "v1" : 56, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -403 },\n\t\t\t{ "v0" : 57, "v1" : 58, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -434 },\n\t\t\t{ "v0" : 59, "v1" : 60, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -558 },\n\t\t\t{ "v0" : 61, "v1" : 62, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -589 },\n\t\t\t{ "v0" : 63, "v1" : 64, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 186 },\n\t\t\t{ "v0" : 65, "v1" : 66, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 62 },\n\t\t\t{ "v0" : 67, "v1" : 68, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 31 },\n\t\t\t{ "v0" : 69, "v1" : 70, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -93 },\n\t\t\t{ "v0" : 71, "v1" : 72, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -124 },\n\t\t\t{ "v0" : 73, "v1" : 74, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -248 },\n\t\t\t{ "v0" : 75, "v1" : 76, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -279 },\n\t\t\t{ "v0" : 77, "v1" : 78, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -403 },\n\t\t\t{ "v0" : 79, "v1" : 80, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -434 },\n\t\t\t{ "v0" : 81, "v1" : 82, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -558 },\n\t\t\t{ "v0" : 83, "v1" : 84, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -589 },\n\t\t\t{ "v0" : 85, "v1" : 86, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 186 },\n\t\t\t{ "v0" : 87, "v1" : 88, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 651 },\n\t\t\t{ "v0" : 89, "v1" : 90, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 651 },\n\t\t\t{ "v0" : 91, "v1" : 92, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 682 },\n\t\t\t{ "v0" : 93, "v1" : 94, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 682 },\n\t\t\t{ "v0" : 95, "v1" : 96, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 527 },\n\t\t\t{ "v0" : 97, "v1" : 98, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 527 },\n\t\t\t{ "v0" : 99, "v1" : 100, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 496 },\n\t\t\t{ "v0" : 101, "v1" : 102, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 496 },\n\t\t\t{ "v0" : 103, "v1" : 104, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 372 },\n\t\t\t{ "v0" : 105, "v1" : 106, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 403 },\n\t\t\t{ "v0" : 107, "v1" : 108, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 372 },\n\t\t\t{ "v0" : 109, "v1" : 110, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 341 },\n\t\t\t{ "v0" : 111, "v1" : 112, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 217 },\n\t\t\t{ "v0" : 113, "v1" : 114, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 217 },\n\t\t\t{ "v0" : 117, "v1" : 118, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -682 },\n\t\t\t{ "v0" : 119, "v1" : 120, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -682 },\n\t\t\t{ "v0" : 121, "v1" : 122, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -651 },\n\t\t\t{ "v0" : 123, "v1" : 124, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -651 },\n\t\t\t{ "v0" : 125, "v1" : 126, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -527 },\n\t\t\t{ "v0" : 127, "v1" : 128, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -527 },\n\t\t\t{ "v0" : 129, "v1" : 130, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -496 },\n\t\t\t{ "v0" : 131, "v1" : 132, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -496 },\n\t\t\t{ "v0" : 133, "v1" : 134, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -372 },\n\t\t\t{ "v0" : 135, "v1" : 136, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -372 },\n\t\t\t{ "v0" : 137, "v1" : 138, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -341 },\n\t\t\t{ "v0" : 139, "v1" : 140, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -341 },\n\t\t\t{ "v0" : 141, "v1" : 142, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -217 },\n\t\t\t{ "v0" : 143, "v1" : 144, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -186 },\n\t\t\t{ "v0" : 145, "v1" : 146, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -217 },\n\t\t\t{ "v0" : 147, "v1" : 148, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -186 },\n\t\t\t{ "v0" : 149, "v1" : 150, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -62 },\n\t\t\t{ "v0" : 151, "v1" : 152, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -31 },\n\t\t\t{ "v0" : 153, "v1" : 154, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -62 },\n\t\t\t{ "v0" : 155, "v1" : 156, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -31 },\n\t\t\t{ "v0" : 157, "v1" : 158, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 93 },\n\t\t\t{ "v0" : 159, "v1" : 160, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 93 },\n\t\t\t{ "v0" : 161, "v1" : 162, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 124 },\n\t\t\t{ "v0" : 163, "v1" : 164, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 124 },\n\t\t\t{ "v0" : 165, "v1" : 166, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 248 },\n\t\t\t{ "v0" : 167, "v1" : 168, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 248 },\n\t\t\t{ "v0" : 169, "v1" : 170, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 279 },\n\t\t\t{ "v0" : 171, "v1" : 172, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 279 },\n\t\t\t{ "v0" : 173, "v1" : 174, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 341 },\n\t\t\t{ "v0" : 175, "v1" : 176, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 403 },\n\t\t\t{ "v0" : 177, "v1" : 178, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 434 },\n\t\t\t{ "v0" : 179, "v1" : 180, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 434 },\n\t\t\t{ "v0" : 181, "v1" : 182, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 558 },\n\t\t\t{ "v0" : 183, "v1" : 184, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 558 },\n\t\t\t{ "v0" : 185, "v1" : 186, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 589 },\n\t\t\t{ "v0" : 187, "v1" : 188, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 589 },\n\t\t\t{ "v0" : 189, "v1" : 190, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 713 },\n\t\t\t{ "v0" : 191, "v1" : 192, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 744 },\n\t\t\t{ "v0" : 193, "v1" : 194, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 744 },\n\t\t\t{ "v0" : 195, "v1" : 196, "color" : "BA0101", "trait" : "yardline", "x" : -465 },\n\t\t\t{ "v0" : 197, "v1" : 198, "color" : "BA0101", "trait" : "yardline", "x" : -459 },\n\t\t\t{ "v0" : 199, "v1" : 200, "color" : "BA0101", "trait" : "yardline", "x" : 459 },\n\t\t\t{ "v0" : 201, "v1" : 202, "color" : "BA0101", "trait" : "yardline", "x" : 465 },\n\t\t\t{ "v0" : 203, "v1" : 204, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -744 },\n\t\t\t{ "v0" : 205, "v1" : 206, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -542.5 },\n\t\t\t{ "v0" : 207, "v1" : 208, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -387.5 },\n\t\t\t{ "v0" : 209, "v1" : 210, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -232.5 },\n\t\t\t{ "v0" : 211, "v1" : 212, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -77.5 },\n\t\t\t{ "v0" : 213, "v1" : 214, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 77.5 },\n\t\t\t{ "v0" : 215, "v1" : 216, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 232.5 },\n\t\t\t{ "v0" : 217, "v1" : 218, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 387.5 },\n\t\t\t{ "v0" : 219, "v1" : 220, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 387.5 },\n\t\t\t{ "v0" : 221, "v1" : 222, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 232.5 },\n\t\t\t{ "v0" : 223, "v1" : 224, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 77.5 },\n\t\t\t{ "v0" : 225, "v1" : 226, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 542.5 },\n\t\t\t{ "v0" : 227, "v1" : 228, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : 697.5 },\n\t\t\t{ "v0" : 229, "v1" : 230, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -77.5 },\n\t\t\t{ "v0" : 231, "v1" : 232, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -232.5 },\n\t\t\t{ "v0" : 233, "v1" : 234, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -387.5 },\n\t\t\t{ "v0" : 235, "v1" : 236, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -542.5 },\n\t\t\t{ "v0" : 237, "v1" : 238, "vis" : true, "color" : "c7e6bd", "trait" : "yardline", "x" : -697.5 }\n\n\t\t],\n\n\t\t"goals" : [\n\t\t\t{ "p0" : [-1065,0 ], "p1" : [-1005,0 ], "team" : "blue" },\n\t\t\t{ "p0" : [1006.9833374023,1.6000061035156 ], "p1" : [1063.9833374023,1.6000061035156 ], "team" : "red" }\n\n\t\t],\n\n\t\t"discs" : [\n\t\t\t{ "pos" : [930,-60 ], "trait" : "goalPost" },\n\t\t\t{ "pos" : [-930,-60 ], "trait" : "goalPost" },\n\t\t\t{ "pos" : [-930,60 ], "trait" : "goalPost" },\n\t\t\t{ "pos" : [930,60 ], "trait" : "goalPost" },\n\t\t\t\n\t\t\t{ "pos" : [930,266 ], "trait" : "goalmarker" },\n\t\t\t{ "pos" : [775,-266 ], "trait" : "goalmarker" },\n\t\t\t{ "pos" : [-930,266 ], "trait" : "goalmarker" },\n\t\t\t{ "pos" : [-930,-266 ], "trait" : "goalmarker" },\n\t\t\t{ "pos" : [775,266 ], "trait" : "goalmarker" },\n\t\t\t{ "pos" : [930,-266 ], "trait" : "goalmarker" },\n\t\t\t{ "pos" : [-775,266 ], "trait" : "goalmarker" },\n\t\t\t{ "pos" : [-775,-266 ], "trait" : "goalmarker" }\n\n\t\t],\n\n\t\t"planes" : [\n\t\t\t{ "normal" : [0,1 ], "dist" : -350, "trait" : "ballArea" },\n\t\t\t{ "normal" : [0,-1 ], "dist" : -350, "bCoef" : 1, "trait" : "ballArea" },\n\t\t\t{ "normal" : [1,0 ], "dist" : -1065, "trait" : "ballArea" },\n\t\t\t{ "normal" : [-1,0 ], "dist" : -1065, "trait" : "ballArea" },\n\t\t\t\n\t\t\t{ "normal" : [0,1 ], "dist" : -375, "bCoef" : 0.9 },\n\t\t\t{ "normal" : [0,-1 ], "dist" : -375, "bCoef" : 0.9 },\n\t\t\t{ "normal" : [1,0 ], "dist" : -1090, "bCoef" : 0.9 },\n\t\t\t{ "normal" : [-1,0 ], "dist" : -1090, "bCoef" : 0.9 }\n\n\t\t],\n\n\t\t"traits" : {\n\t\t\t"ballArea" : { "vis" : false, "bCoef" : 1, "cMask" : ["ball" ] },\n\t\t\t"endline" : { "vis" : false, "bCoef" : 1, "cMask" : ["ball" ] },\n\t\t\t"goalPost" : { "radius" : 4, "invMass" : 0, "bCoef" : 0.5, "color" : "FFFF00" },\n\t\t\t"goalNet" : { "vis" : true, "bCoef" : 0.1, "cMask" : ["ball" ] },\n\t\t\t"kickOffBarrier" : { "vis" : false, "bCoef" : 0.1, "cGroup" : ["redKO","blueKO" ], "cMask" : ["red","blue" ] },\n\t\t\t"goalline" : { "vis" : true, "color" : "FFFF00", "cMask" : [ ] },\n\t\t\t"yardline" : { "vis" : true, "color" : "c7e6bd", "cMask" : [ ] },\n\t\t\t"centerline" : { "vis" : true, "color" : "0000CC", "cMask" : [ ] },\n\t\t\t"goalmarker" : { "vis" : true, "color" : "FF0000", "cMask" : [ ], "radius" : 3 },\n\t\t\t"goal" : { "vis" : true, "color" : "FF0000" }\n\n\t\t},\n\n\t\t"ballPhysics" : {\n\t\t\t"cMask" : [ "wall", "red", "blue"\n\t\t\t],\n\t\t\t"cGroup" : [ "ball"\n\t\t\t],\n\t\t\t"color" : "631515",\n\t\t\t"radius" : 8.5\n\n\t\t},\n\n\t\t"playerPhysics" : {\n\t\t\t"kickStrength" : 6.8,\n\t\t\t"bCoef" : 0.75\n\n\t\t}\n\t}',
  gn = {};

function inRedZone(redZoneCheck) {
  if(((redZoneCheck >= 80) && (xt == 2)) || ((redZoneCheck <= 20) && (xt == 1))) {
    return true
  }
  return false
}

function isRedZone(redZoneCheck, t) {
  if(redZoneSpot <= 20 && t > redZoneSpot && ((redZoneCheck >= 80 && xt == 2) || (redZoneCheck <= 20 && xt == 1))) {
    return true
  }
  return false
}

function bn(t, n) {
  var e = t.x - n.x,
    i = t.y - n.y;
  return Math.sqrt(e * e + i * i)
}

function Cn() {
  var t = pn.getPlayerList();
  if (2 == xt)
    for (var n = 0; n < t.length; n++) {
      if(t[n].team == xt && null != t[n].position && t[n].position.x < _.x) { 
          vt = !1, pn.pauseGame(!0), pn.sendChat(d + " OFFSIDES on " + t[n].name + " 5 YARD Penalty, repeat the Down. " + d), yn = qn(-5), Fn(Z += yn, !0), pn.pauseGame(!1);
      }
    }
  else if (1 == xt)
    for (n = 0; n < t.length; n++) {
      if(t[n].team == xt && null != t[n].position && t[n].position.x > _.x ) {
        vt = !1, pn.pauseGame(!0), pn.sendChat(d + " OFFSIDES on " + t[n].name + " 5 YARD Penalty, repeat the Down. " + d), yn = qn(-5), Fn(Z += yn, !0), pn.pauseGame(!1)
      }
    }
}

function Bn() {
  if (1 == ct && 0 == ut) {
    var t = pn.getBallPosition(),
      n = pn.getPlayerList();
    if (t.y - b < m) return ct = !1, vt = !1, st = !1, pn.sendChat(y + " Incomplete - Thrown Out of Bounds Top Side Line " + y), Fn(Z, !1), L.get(bt)[2] += 1, hike = 0, "incomplete";
    if (t.y + b > p) return ct = !1, vt = !1, st = !1, pn.sendChat(y + " Incomplete - Thrown Out of Bounds Bottom Side Line " + y), L.get(bt)[2] += 1, Fn(Z, !1), hike = 0, "incomplete";
    if (t.x + b > h) return ct = !1, vt = !1, st = !1, pn.sendChat(y + " Incomplete - Thrown Out of Bounds Right End Zone " + y), L.get(bt)[2] += 1, Fn(Z, !1), hike = 0, "incomplete";
    if (t.x - b < g) return ct = !1, vt = !1, st = !1, pn.sendChat(y + " Incomplete - Thrown Out of Bounds Left End Zone " + y), L.get(bt)[2] += 1, Fn(Z, !1), hike = 0, "incomplete";
    for (var e = 0; e < n.length; e++) null != n[e].position && n[e].id == q && (St = e);
    for (e = 0; e < n.length; e++) {
      if (null != n[e].position)
        if (n[e].id != q)
          if (bn(n[e].position, t) < U) return n[e].team == xt ? (j = Z, X = n[e].id, st = !0, ct = !1, pn.sendChat(ballAvatar + " Caught by " + n[e].name + " " + ballAvatar), L.get(bt)[1] += 1, L.get(bt)[2] += 1, L.get(n[e].name)[5] += 1, pn.setPlayerAvatar(n[e].id, ballAvatar), "complete") : (ct = !1, vt = !1, st = !1, pn.sendChat(y + " Incomplete, pass broken up by " + n[e].name + " " + y), q = null, pb = 1, intTime = Ft, L.get(bt)[2] += 1, L.get(n[e].name)[10] += 1, L.get(n[e].name)[17] = 1, Fn(Z, !1), hike = 0, pn.setPlayerAvatar(n[e].id, wl), setKicker(n[e].id), InterceptionID = n[e].id, intDown = 0, "incomplete")
    }
  }
}

function On(t) {
  pn.setPlayerAdmin(t, !0)
}

function Og(t) {
  //Set player properties
  for(var e = pn.getPlayerList(), n = 0; n < e.length; n++) {
    if(e[n].position != null) {
      if(e[n].team == 1) {
        pn.setPlayerDiscProperties(e[n].id, {x: t - 125})
        pn.setPlayerDiscProperties(e[n].id, {xspeed: 0, yspeed: 0})
      }
      else{
        pn.setPlayerDiscProperties(e[n].id, {x: t + 125})
        pn.setPlayerDiscProperties(e[n].id, {xspeed: 0, yspeed: 0})
      }
    }
  }
  //Set ball properties
  pn.setDiscProperties(0, {x: t, y: 0})
  pn.setDiscProperties(0, {xspeed: 0, yspeed: 0})
  pn.setDiscProperties(0, {invMass: 0.000001})
}

function Pn() {
  if (1 == st || 1 == ut) {
    for (var t = pn.getPlayerList(), n = 0; n < t.length; n++)
      if (t[n].id == X) var e = n;
    if (Yn(t[e], t, "currentPlayerWithBallI"), null != t[e].position) {
      if (t[e].position.y - T < m) {
        vt = !1, st = !1, pn.sendChat("Out Of Bounds - Top Side Line"), an = Z, Z = Tn(t[e].position, !0), Og(t[e].position.x), hike = 0, pn.setPlayerAvatar(t[e].id, null), L.get(t[e].name)[16] = 0;
        var i = Math.abs(an - Z);
        0 == ut ? (L.get(bt)[0] += i, L.get(t[e].name)[4] += i) : L.get(t[e].name)[7] += i, ut = !1, Fn(Z, !1)
      } else if (t[e].position.y + T > p) {
        vt = !1, st = !1, pn.sendChat("Out Of Bounds - Bottom Side Line"), an = Z, Z = Tn(t[e].position, !0), Og(t[e].position.x), hike = 0, pn.setPlayerAvatar(t[e].id, null), L.get(t[e].name)[16] = 0;
        i = Math.abs(an - Z);
        0 == ut ? (L.get(bt)[0] += i, L.get(t[e].name)[4] += i) : L.get(t[e].name)[7] += i, ut = !1, Fn(Z, !1)
      }
      for (n = 0; n < t.length; n++) {
        if (null != t[n].position)
          if (t[n].id != X)
            if (t[n].team != xt)
              if(0 == ut) { //It's a pass
                if (bn(t[n].position, t[e].position) < W) {
                    an = Z;
                    var a = Tn(t[e].position, !0),
                      r = An(a);
                    i = Math.abs(Z - a);
                    Z = a, L.get(t[n].name)[11] += 1, Fn(a, !1), vt = !1, st = !1, 1 == xt && a >= 100 && (pn.sendChat("TOUCHDOWN!!"), L.get(bt)[22] += 1, L.get(t[e].name)[9] += 1, $n(7)), 2 == xt && a <= 0 && (pn.sendChat("TOUCHDOWN!!"), L.get(bt)[22] += 1, L.get(t[e].name)[9] += 1, $n(7)), L.get(bt)[0] += i, L.get(t[e].name)[4] += i, pn.sendChat("Caught by " + t[e].name + " Tackled by " + t[n].name + " @ " + r), Og(t[e].position.x), hike = 0, pn.setPlayerAvatar(t[e].id, null), pn.setPlayerAvatar(t[n].id, z), ut = !1
                }
              }
              else{ //It's a run
                if (bn(t[n].position, t[e].position) < W) {
                    L.get(t[e].name)[16] += 1
                    if(L.get(t[e].name)[16] == 1) {
                        pn.sendChat(z + t[e].name + " broke through " + t[n].name + "'s tackle!" + z)
                    }
                    if(L.get(t[e].name)[16] == 2) {
                        an = Z;
                        var a = Tn(t[e].position, !0),
                        r = An(a);
                        i = Math.abs(Z - a);
                        Z = a, L.get(t[n].name)[11] += 1, Fn(a, !1), vt = !1, st = !1, 1 == xt && a >= 100 && (pn.sendChat("TOUCHDOWN!!"), L.get(bt)[22] += 1, L.get(t[e].name)[9] += 1, $n(7)), 2 == xt && a <= 0 && (pn.sendChat("TOUCHDOWN!!"), L.get(bt)[22] += 1, L.get(t[e].name)[9] += 1, $n(7)), L.get(t[e].name)[7] += i, pn.sendChat("Run by " + t[e].name + " Tackled by " + t[n].name + " @ " + r), L.get(t[e].name)[16] = 0, hike = 0, Og(t[e].position.x), pn.setPlayerAvatar(t[e].id, null), pn.setPlayerAvatar(t[n].id, z), ut = !1
                    }
                }
              }
              
      }
    }
  }
}

function kn() {
  if (1 == vt && 0 == ct && 0 == st && 0 == ut) {
    var t = pn.getBallPosition();
    if (D.x != t.x || D.y != t.y) bn(D, t) > H && (pn.pauseGame(!0), vt = !1, pn.sendChat(d + " QB Dragged the ball, incomplete " + d), L.get(bt)[2] += 1, Fn(Z, !1), hike = 0, pn.pauseGame(!1))
  }
}

function Tn(t, n) {
  if (1 == n) var e = T;
  else e = b;
  if (1 == xt) var i = t.x + e;
  else if (2 == xt) i = t.x - e;
  else i = t.x;
  return i >= 0 ? 1 == xt ? Math.ceil(50 - i / O) : Math.floor(50 - i / O) : 1 == xt ? Math.ceil(50 + Math.abs(i) / O) : Math.floor(50 + Math.abs(i) / O)
}

function An(t) {
  return t < 50 ? "Blue " + t : t > 50 ? "Red " + (100 - t) : "" + t
}

function Dn() {
  for (var t = pn.getPlayerList(), n = 0; n < t.length; n++) {
    K = n + " - " + t[n].id + " - " + t[n].team + " - " + t[n].name;
    ot = !1
  }
}

function Ln() {
  0 == dt && (dt = 1 == xt ? Z - 20 : Z + 20)
}

function Fn(t, n) {
  var e = t; t < 50 ? redZoneSpot = t : redZoneSpot = 100 - t; redZoneCheck = t; playDead = Ft;
  if(pb == 0) {
    Og(775-e*15.5)
  }
  Yt = An(e), Ln(), hike = 0, 1 == xt && (yt = Math.abs(dt - e), isRedZone(redZoneCheck, yt) ? yt = "Goal" : yt = yt, e <= dt ? (pn.sendChat("First Down!"), A = 1, dt = e - 20, yt = Math.abs(dt - e), isRedZone(redZoneCheck, yt) ? yt = "Goal" : yt = yt, pn.sendChat(A + " n " + yt + " @ " + Yt)) : (1 != n && A++, isRedZone(redZoneCheck, yt) ? yt = "Goal" : yt = yt, pn.sendChat(A + " n " + yt + " @ " + Yt)), 1 == A && 0 == n && (dt = e - 20), A > 4 && (Qt = !0, A = 1, pn.sendChat("Turn Over on Downs - BLUE Ball @ " + Yt), dt = e + 20)), 2 == xt && (yt = Math.abs(dt - e), e >= dt ? (pn.sendChat("First Down!"), A = 1, dt = e + 20, yt = Math.abs(dt - e), isRedZone(redZoneCheck, yt) ? yt = "Goal" : yt = yt, pn.sendChat(A + " n " + yt + " @ " + Yt)) : (1 != n && A++, isRedZone(redZoneCheck, yt) ? yt = "Goal" : yt = yt, pn.sendChat(A + " n " + yt + " @ " + Yt)), 1 == A && 0 == n && (dt = e + 20), A > 4 && (Qt = !0, A = 1, pn.sendChat("Turn Over on Downs - RED Ball @ " + Yt), dt = e - 20)), 1 == Qt && (xt = 1 == xt ? 2 : 1, Qt = !1)
}

function Sn(t) {
  1 == ct && 1 == vt && 0 == ut && (t.id == q || t.team != xt ? (pn.sendChat(y + " Pass Incomplete, broken up by " + t.name + " " + y), ct = !1, vt = !1, st = !1, L.get(bt)[2] += 1, L.get(t.name)[10] += 1, L.get(t.name)[17] = 1, pb = 1, intTime = Ft, intDown = 0, Fn(Z, !1), InterceptionID = t.id, setKicker(t.id), pn.setPlayerAvatar(t.id, wl)) : (pn.sendChat(ballAvatar + " Pass Caught by " + t.name + " " + ballAvatar), X = t.id, Y = t.team, st = !0, ct = !1, L.get(bt)[2] += 1, L.get(bt)[1] += 1, L.get(t.name)[5] += 1, pn.setPlayerAvatar(t.id, ballAvatar)))
}

function In(t) {
  if (1 == It && 1 == wt) {
    var n = pn.getBallPosition();
    if (t.team != xt) {
      It = !1, wt = !1, Gt = !1;
      var e = An(Z = Tn(n, !1));
      pn.sendChat("Ball Downed by Kicking Team (" + t.name + ") @ " + e), A = 1, Ln(), Og(t.position.x), hike = 0
    } else X = t.id, Gt = !0, It = !1, pn.sendChat("Kick Caught by " + t.name), pn.setPlayerAvatar(t.id, ballAvatar);
  }
}

function wn(t, n) {
  if (1 == t.team)
    for (i = 0; i < xn.length; i++) pn.sendChat(t.name.slice(0, 3) + " " + u + ": " + n.slice(1), xn[i].id);
  if (2 == t.team)
    for (i = 0; i < fn.length; i++) pn.sendChat(t.name.slice(0, 3) + " " + u + ": " + n.slice(1), fn[i].id)
}

function Gn() {
  Z = 2 == xt ? 40 : 60
}

function Rn() {
  if (1 == It && 1 == wt) {
    var t = pn.getBallPosition(),
      n = pn.getPlayerList();
    if (t.y - b < m) It = !1, wt = !1, Gt = !1, pn.sendChat(d + " PENALTY - KICK OUT OF Bounds " + d), pn.sendChat("Ball at the 40 Yard Line"), Gn(), Fn(Z, !0);
    else if (t.y + b > p) It = !1, wt = !1, Gt = !1, pn.sendChat(d + " PENALTY - KICK OUT OF Bounds " + d), pn.sendChat("Ball at the 40 Yard Line"), Gn(), Fn(Z, !0);
    else
      for (var e = 0; e < n.length; e++) {
        if (null != n[e].position)
          if (bn(n[e].position, t) < U)
            if (n[e].team == xt) j = Z, X = n[e].id, Gt = !0, It = !1, pn.sendChat("Kick Caught by " + n[e].name), pn.setPlayerAvatar(n[e].id, ballAvatar);
            else {
              It = !1, wt = !1, Gt = !1;
              var i = An(Z = Tn(t, !1));
              pn.sendChat("Ball Downed by Kicking Team (" + n[e].name + ") @ " + i), A = 1, Fn(Z, !0), Og(n[e].position.x)
            }
      }
  }
}

function Mn() {
  if (1 == wt && 1 == Gt) {
    for (var t = pn.getPlayerList(), n = 0; n < t.length; n++)
      if (t[n].id == X) var e = n;
    if (Yn(t[e], t, "currentPlayerWithBallI"), null != t[e].position) {
      if (t[e].position.y - T < m) {
        wt = !1, Gt = !1;
        var i = An(Z = Tn(t[e].position, !0));
        pn.sendChat(t[e].name + " stepped Out Of Bounds - Top Side Line @ " + i), A = 1, hike = 0
         if(Z <= 0 || Z >= 100) {
           pn.sendChat("Touchback")
           if(t[e].team == 1){
            Og(-1*(775-20*15.5))
           }
           else{
            Og(775-20*15.5)
           }
         }
         else{
          Og(t[e].position.x)
         }
        pn.setPlayerAvatar(t[e].id, null);
      } else if (t[e].position.y + T > p) {
        wt = !1, Gt = !1;
        i = An(Z = Tn(t[e].position, !0));
        pn.sendChat(t[e].name + " stepped Out Of Bounds - Bottom Side Line @ " + i), A = 1, hike = 0
        if(Z <= 0 || Z >= 100) {
          pn.sendChat("Touchback")
          if(t[e].team == 1){
           Og(-1*(775-20*15.5))
          }
          else{
           Og(775-20*15.5)
          }
        }
        else{
         Og(t[e].position.x)
        }
       pn.setPlayerAvatar(t[e].id, null);
      }
      else if (Math.abs(t[e].position.x) > 900) {
        wt = !1, Gt = !1;
        i = An(Z = Tn(t[e].position, !0));
        pn.sendChat(t[e].name + " stepped Out Of Bounds - Back of the Endzone "), A = 1, hike = 0
        if(Z <= 0 || Z >= 100) {
          pn.sendChat("Touchback")
          if(t[e].team == 1){
           Og(-1*(775-20*15.5))
          }
          else{
           Og(775-20*15.5)
          }
        }
        else{
         Og(t[e].position.x)
        }
       pn.setPlayerAvatar(t[e].id, null);
      }
      for (n = 0; n < t.length; n++) {
        if (null != t[n].position)
          if (t[n].id != X)
            if (t[n].team != xt)
              if (bn(t[n].position, t[e].position) < W) {
                var a = Tn(t[e].position, !0),
                  r = An(a);
                Z = a, A = 1, Ln(), wt = !1, Gt = !1, pn.sendChat("Kickoff Caught by " + t[e].name + " Tackled by " + t[n].name + " @ " + r), Fn(Z, !0), Og(t[e].position.x), pn.setPlayerAvatar(t[e].id, null), pn.setPlayerAvatar(t[n].id, z)
              }
      }
    }
  }
}

function getBallPos() {
  kickDistance = Math.round(50 - Math.abs((pn.getBallPosition().x)/775*50))
}

function setKicker(t) {
  kicker = t
}

function En() {
  if (1 == Nt && 1 == Ut) {
    for (var t = pn.getBallPosition(), n = pn.getPlayerList(), e = 0; e < n.length; e++) null != n[e].position && bn(t, n[e].position) < U && (n[e].team == xt ? (Un(), pn.sendChat("Ball touched early by " + n[e].name)) : (pn.sendChat("Automatic!, touched by " + n[e].name), Nn(), td(kicker.team)));
    (t.x - b > w || t.x + b < -1 * w) && Nn(), (t.y > G + 1 || t.y < -1 * G - 1) && Un(), Wn(sn, t, 0), sn = t
  }
}

function Nn() {
  fgCall = 0, Nt = !1, Ut = !1, 1 == xt ? vn += 3 : 2 == xt && (un += 3), pn.sendChat("FG by " + kicker.name + " from " + kickDistance + " yards IS GOOD!!"), L.get(kicker.name)[19] += 1, L.get(kicker.name)[20] += 1, L.get(kicker.name)[21] += kickDistance, td(kicker.team)
}

function Un() {
 fgCall = 0, Nt = !1, Ut = !1, 2 == xt ? (A = 1, xt = 1, pn.sendChat("FG NO GOOD, Turn Over, Red Ball"), Fn(Z, !0)) : (pn.sendChat("FG NO GOOD, Turn Over, Blue Ball"), A = 1, xt = 2, dt = 0, Fn(Z, !0)); if(delay == 0) {L.get(kicker.name)[19] += 1}
}

function fgDelay() {
  if((Ft > en + 600) && (fgCall == 1) && !(1 == Nt && 1 == Ut)){
    pn.sendChat("Delay of game, took longer than 10 seconds to kick."); delay = 1, Un()
  }
}

function Wn(t, n, e) {
  return bn(t, n) > e
}

function Qn() {
  if (1 == Rt && 1 == Mt) {
    var t = pn.getBallPosition(),
      n = pn.getPlayerList();
    if (t.y - b < m) {
      Rt = !1, Mt = !1, Et = !1;
      var e = An(Z = Tn(t, !1));
      pn.sendChat("Punt Kicked out of bounds @ " + e), pn.sendChat("1 n 20 @ " + e), A = 1, Ln(), Og(775-15.5*Z)
    } else if (t.y + b > p) {
      Rt = !1, Mt = !1, Et = !1;
      e = An(Z = Tn(t, !1));
      pn.sendChat("Punt Kicked out of bounds @ " + e), pn.sendChat("1 n 20 @ " + e), A = 1, Ln(), Og(775-15.5*Z)
    } else
      for (var i = 0; i < n.length; i++) {
        if (null != n[i].position)
          if (bn(n[i].position, t) < U)
            if (n[i].team == xt) j = Z, X = n[i].id, Et = !0, Rt = !1, pn.sendChat("Punt Caught by " + n[i].name), pn.setPlayerAvatar(n[i].id, ballAvatar);
            else {
              Rt = !1, Mt = !1, Et = !1;
              var a = An(Z = Tn(t, !1));
              pn.sendChat("Ball Downed by Punting Team (" + n[i].name + ") @ " + a), A = 1, Fn(Z, !0), Og(n[i].position.x)
            }
      }
  }
}

function Hn() {
  if (1 == Mt && 1 == Et) {
    for (var t = pn.getPlayerList(), n = 0; n < t.length; n++)
      if (t[n].id == X) var e = n;
    if (null != t[e].position) {
      if (t[e].position.y - T < m) {
        Mt = !1, Et = !1;
        var i = An(Z = Tn(t[e].position, !0));
        Yt = i, pn.sendChat(t[e].name + " stepped Out Of Bounds - Top Side Line @ " + i), A = 1, Fn(Z, !0), Og(t[e].position.x), pn.setPlayerAvatar(t[e].id, null);
      } else if (t[e].position.y + T > p) {
        Mt = !1, Et = !1;
        i = An(Z = Tn(t[e].position, !0));
        Yt = i, pn.sendChat(t[e].name + " stepped Out Of Bounds - Bottom Side Line @ " + i), A = 1, Fn(Z, !0), Og(t[e].position.x), pn.setPlayerAvatar(t[e].id, null);
      }
      for (n = 0; n < t.length; n++) {
        if (null != t[n].position)
          if (t[n].id != X)
            if (t[n].team != xt)
              if (bn(t[n].position, t[e].position) < W) {
                var a = Tn(t[e].position, !0),
                  r = An(a);
                Yt = r, Z = a, A = 1, Mt = !1, Et = !1, pn.sendChat("Punt Caught by " + t[e].name + " Tackled by " + t[n].name + " @ " + Yt), Fn(Z, !0), Og(t[e].position.x), pn.setPlayerAvatar(t[e].id, null), pn.setPlayerAvatar(t[n].id, z)
              }
      }
    }
  }
}

function Kn(t) {
  if (1 == Rt && 1 == Mt) {
    var n = pn.getBallPosition();
    if (t.team != xt) {
      Rt = !1, Mt = !1, Et = !1;
      var e = An(Z = Tn(n, !1));
      Yt = e, pn.sendChat("Ball Downed by Punting Team (" + t.name + ") @ " + e), A = 1, Fn(Z, !0), Og(t.position.x)
    } else X = t.id, Et = !0, Rt = !1, pn.sendChat("Kick Caught by " + t.name), pn.setPlayerAvatar(t.id, ballAvatar)
  }
}

function Yn(t, n, e) {
  void 0 === t && ("QbArrI" == e && (n[St = 0] = 0), "currentPlayerWithBallI" == e ? (currentPlayerWithBallI = 0, X = 0, n[currentPlayerWithBallI] = 0) : i = 0, vt = !1)
}

function jn() {
  if (1 == vt && 0 == ct && 0 == st && 0 == ut) {
    for (var t = pn.getPlayerList(), n = 0; n < t.length; n++)
      if (null != t[n].position && t[n].id == q) var e = n;
    for (n = 0; n < t.length; n++) {
      if (null != t[n].position)
        if (Yn(t[e], t, "QbArrI"), null != t[e].position)
          if (t[n].id != q)
            if (t[n].team == xt)
              if (bn(t[n].position, t[e].position) < W) 1 == Jn(t[e].position, t[n].position) ? (ut = !0, rn = !1, pn.sendChat(l + " Run by " + t[n].name + " " + l), L.get(t[n].name)[8] += 1, X = t[n].id, pn.setPlayerAvatar(t[n].id, ballAvatar)) : (vt = !1, pn.sendChat(y + " Illegal run by " + t[n].name + " " + y), Fn(Z, !1))
    }
  }
}

function _n(t) {
  if (1 == vt && 0 == ct && 0 == st && 0 == ut && 0 == rn && t.team != xt)
    if (Ft - en > 720) X = q, ut = !0, pn.sendChat(l + " QB Run by " + bt + " " + l), pn.setPlayerAvatar(X, ballAvatar), L.get(bt)[8] += 1, L.get(bt)[16] = 1
    else {
      if(inRedZone(redZoneCheck)) {
        pn.pauseGame(!0), pn.sendChat(d + " Illegal Touching by " + t.name + " at " + Math.floor((Ft - en) / 60) + " seconds. Half distance to the goal " + d), vt = !1;
        var n = qn(Math.floor(redZoneSpot/2));
        Fn(Z += n, !0), pn.pauseGame(!1)
        if(t.team == xt) {
          redZonePenalty -= 1;
        }
        else {
          redZonePenalty += 1; 
        }
        pn.sendChat("Red zone penalty [" + redZonePenalty + "/3]")
          if(redZonePenalty == 3) {
            pn.sendChat("Automatic touchdown"); pn.setPlayerAvatar(t.id, clown)
            if(t.team == 1) {
              td(2)
            }
            else{
              td(1)
            }
          }
      }
      else{
        pn.pauseGame(!0), pn.sendChat(d + " Illegal Touching by " + t.name + " at " + Math.floor((Ft - en) / 60) + " seconds. 10 Yard Penalty " + d), vt = !1;
        var n = qn(10);
        Fn(Z += n, !0), pn.pauseGame(!1)
      }
    }
}

function Xn(t) {
  if (1 == vt && 0 == ct && 0 == st && 0 == ut)
    if(Ft - en > 840) {rn = 1;}
    for (var n = pn.getBallPosition(), e = 0; e < t.length; e++)
      if (null != t[e].position) {
        if (t[e].id == q && (St = e, 1 == xt ? t[e].position.x > (n.x + b + T) && (1 == rn ? (X = q, ut = !0, rn = !1, pn.sendChat(l + " QB Run by " + bt + " " + l), L.get(bt)[8] += 1, pn.setPlayerAvatar(X, ballAvatar), L.get(bt)[16] = 1) : t[e].position.x - b - T > n.x && (pn.pauseGame(!0), pn.sendChat(d + " Incomplete - QB Illegally Crossed the Line of Scrimmage " + d), vt = !1, Fn(Z, !1), pn.pauseGame(!1))) : t[e].position.x < (n.x - b - T) && (1 == rn ? (X = q, ut = !0, rn = !1, pn.sendChat(l + " QB Run by " + bt + " " + l), L.get(bt)[8] += 1, pn.setPlayerAvatar(X, ballAvatar), L.get(bt)[16] = 1) : t[e].position.x + b + T < n.x && (pn.pauseGame(!0), pn.sendChat(d + " Incomplete - QB Illegally Crossed the Line of Scrimmage " + d), vt = !1, Fn(Z, !1), pn.pauseGame(!1)))), t[e].team != xt)
        if (bn(t[e].position, n) < U && (Ft - en > 720 ? (X = q, ut = !0, pn.sendChat(l + " QB Run by " + bt + " " + l), L.get(bt)[8] += 1, pn.setPlayerAvatar(X, ballAvatar), L.get(bt)[16] = 1) : (pn.pauseGame(!0), pn.sendChat(d + " Illegal Touching by " + t[e].name + " at " + Math.floor((Ft - en) / 60) + " seconds " + d), vt = !1, pn.pauseGame(!1))), 1 == xt) {
            if (t[e].position.x < n.x)
              if (Ft - en > 720) rn = !0;
              else {
                if(inRedZone(redZoneCheck)){
                  pn.pauseGame(!0), pn.sendChat(d + " Illegal Crossing by " + t[e].name + " at " + Math.floor((Ft - en) / 60) + " seconds. Half distance to the goal " + d), vt = !1;
                  var i = qn(Math.floor(redZoneSpot/2));
                  Fn(Z += i, !0), pn.pauseGame(!1)
                  redZonePenalty += 1;
                  pn.sendChat("Red zone penalty [" + redZonePenalty + "/3]")
                  if(redZonePenalty == 3) {
                    pn.sendChat("Automatic touchdown"); pn.setPlayerAvatar(t[e].id, clown)
                    if(t[e].team == 1) {
                      td(2)
                    }
                    else{
                      td(1)
                    }
                  }
                }
                else{
                  pn.pauseGame(!0), pn.sendChat(d + " Illegal Crossing by " + t[e].name + " at " + Math.floor((Ft - en) / 60) + " seconds. 5 Yard Penalty " + d), vt = !1;
                  var i = qn(5);
                  Fn(Z += i, !0), pn.pauseGame(!1)
                }
              }
          } else if (t[e].position.x > n.x)
          if (Ft - en > 720) rn = !0;
          else {
            if(inRedZone(redZoneCheck)){
              pn.pauseGame(!0), pn.sendChat(d + " Illegal Crossing by " + t[e].name + " at " + Math.floor((Ft - en) / 60) + " seconds. Half distance to the goal " + d), vt = !1;
              var i = qn(Math.floor(redZoneSpot/2));
              Fn(Z += i, !0), pn.pauseGame(!1)
              redZonePenalty += 1;
              pn.sendChat("Red zone penalty [" + redZonePenalty + "/3]")
              if(redZonePenalty == 3) {
                pn.sendChat("Automatic touchdown"), pn.setPlayerAvatar(t[e].id, clown)
                if(t[e].team == 1) {
                  td(2)
                }
                else{
                  td(1)
                }
              }
            }
            else{
              pn.pauseGame(!0), vt = !1, pn.sendChat(d + " Illegal Crossing by " + t[e].name + " at " + Math.floor((Ft - en) / 60) + " seconds. 5 Yard Penalty. " + d);
              i = qn(5);
              Fn(Z += i, !0), pn.pauseGame(!1)
            }
          }
        if (1 == rn && 1 == vt && t[e].id != q && null != t[e].position && null != t[St].position && bn(t[e].position, t[St].position) < W) {
          var a = Tn(t[St].position, !0);
          Z = a;
          var r = An(a);
          pn.sendChat(sk+"QB Sacked by " + t[e].name + " at " + r + sk), L.get(t[e].name)[15] += 1, rn = !1, vt = !1, Fn(Z, !1), pn.setPlayerAvatar(t[St].id, dizzy), pn.setPlayerAvatar(t[e].id, sk)
        }
      }
}

function Zn() {
  if (1 == vt && 0 == ct && 0 == st && 0 == ut) {
    var t = pn.getPlayerList();
    zt = !1;
    for (var n = 0; n < t.length; n++) null != t[n].position && t[n].id != q && (nn = t[n].team == xt ? 3 * T : 0, Ft > en + 90 && t[n].position.y <= jt + (nn/2) && t[n].position.y >= -1 * jt - (nn/2) && t[n].position.x >= _t - nn && t[n].position.x <= Xt + nn && (t[n].team != xt ? (Zt++, qt++, zt = !0, tn = t[n].name, crowdID = t[n].id, crowdTeam = t[n].team) : (Zt = 0, qt -= 3)));
    if (0 == zt && (Zt = 0), Zt >= Vt && Ft < 720 + en) {
      if(inRedZone(redZoneCheck)) {
        pn.pauseGame(!0), pn.sendChat(d + " CROWDING on " + tn + ". Half distance to the goal, Repeat The Down. " + " " + d), vt = !1, ut = !1, qt = 0, Zt = 0;
        var e = qn(Math.floor(redZoneSpot/2));
        Fn(Z += e, !0), pn.pauseGame(!1)
        redZonePenalty += 1;
        pn.sendChat("Red zone penalty [" + redZonePenalty + "/3]")
        if(redZonePenalty == 3) {
          pn.sendChat("Automatic touchdown"); pn.setPlayerAvatar(crowdID, clown)
          if(crowdTeam == 1) {
            td(2)
          }
          else{
            td(1)
          }
        }
      }
      else{
        pn.pauseGame(!0), pn.sendChat(d + " CROWDING on " + tn + ". 10 Yard Penalty, Repeat The Down. " + d), vt = !1, ut = !1, qt = 0, Zt = 0;
        var e = qn(10);
        Fn(Z += e, !0), pn.pauseGame(!1)
      }
    }
    if (qt >= Jt && Ft < 720 + en) {
      if(inRedZone(redZoneCheck)) {
        pn.pauseGame(!0), pn.sendChat(d + " CROWD ABUSE on " + tn + ". Half distance to the goal, Repeat The Down. " + d), vt = !1, ut = !1, qt = 0, Zt = 0;
        var e = qn(Math.floor(redZoneSpot/2));
        Fn(Z += e, !0), pn.pauseGame(!1)
        redZonePenalty += 1;
        pn.sendChat("Red zone penalty [" + redZonePenalty + "/3]")
        if(redZonePenalty == 3) {
          pn.sendChat("Automatic touchdown"); pn.setPlayerAvatar(crowdID, clown)
          if(crowdTeam == 1) {
            td(2)
          }
          else{
            td(1)
          }
        }
      }
      else{
        pn.pauseGame(!0), pn.sendChat(d + " CROWD ABUSE on " + tn + ". 10 Yard Penalty, Repeat The Down. " + d), vt = !1, ut = !1, qt = 0, Zt = 0;
        e = qn(10);
        Fn(Z += e, !0), pn.pauseGame(!1)
      }
    }
    Xn(t)
  }
}

function ce(t) {
  console.log(t)
}

function vwe() {
  if(1 == E){
    pn.sendChat("Sending stats to text")
    var t = "League_stats_" + (new Date).toString();
    tt(S, t, "text/plain")
  }
}

function qn(t) {
  if (1 == xt) var n = -1 * t;
  else n = t;
  return Z + n > 100 && (n = Math.floor((100 - Z) / 2)), Z + n < 0 && (n = Math.floor(Z / 2)), n
}

function zn() {
  var t = pn.getBallPosition();
  1 == xt ? (_t = t.x - 4*O, Xt = t.x >= 40 * O ? 48 * O : t.x + 9 * O) : (Xt = t.x + 4*O, _t = t.x <= -40 * O ? -48 * O : t.x - 9 * O)
}

function Vn() {
  var t = pn.getPlayerList().filter(t => 0 != t.id);
  0 != t.length && null == t.find(t => t.admin) && pn.setPlayerAdmin(t[0].id, !0)
}

function Jn(t, n) {
  return 1 == xt ? t.x > n.x : t.x < n.x
}

function $n(t) {
  1 == xt ? vn += t : un += t
}

function te() {
  mn.getTime() > dn && (at = !0)
}

function td(t) {
  redZonePenalty = 0
  if(t == 2) {
    pn.setDiscProperties(0, {x: -1075, y: 30})
  }
  else {
    pn.setDiscProperties(0, {x: 1075, y: 30})
  }
  pn.setDiscProperties(0, {xspeed: 0, yspeed: -1})
}

function ne() {
  if (1 == st || 1 == Gt || 1 == Et || 1 == ut) {
    var t = pn.getPlayerList().filter(t => null != t.position).find(t => t.id == X),
      n = Tn(t.position, !0),
      e = Z;
    if (1 == xt) n <= 0 && n > -10 && (1 == st ? (pn.sendChat("TOUCHDOWN!!! Pass Caught By " + t.name + " for a " + Z + " yard gain."), st = !1, vt = !1, L.get(bt)[0] += e, L.get(t.name)[4] += e, L.get(bt)[22] += 1, L.get(t.name)[9] += 1, $n(7), td(t.team), pn.setPlayerAvatar(t.id, sk)) : 1 == Gt ? (pn.sendChat("TOUCHDOWN!!! Kickoff returned by " + t.name), Gt = !1, wt = !1, L.get(t.name)[9] += 1, $n(7), td(t.team), pn.setPlayerAvatar(t.id, sk)) : 1 == Et ? (pn.sendChat("TOUCHDOWN!!! Punt returned by " + t.name), Et = !1, Mt = !1, L.get(t.name)[9] += 1, $n(7), td(t.team), pn.setPlayerAvatar(t.id, sk)) : 1 == ut && (pn.sendChat("TOUCHDOWN!!! Ball Run by " + t.name + " for a " + Z + " yard gain."), vt = !1, ut = !1, L.get(t.name)[7] += e, L.get(t.name)[18] += 1, L.get(t.name)[16] = 0, $n(7), td(t.team), pn.setPlayerAvatar(t.id, sk)));
    else if (n >= 100 && n < 110) {
      e = 100 - Z;
      1 == st ? (pn.sendChat("TOUCHDOWN!!! Pass Caught By " + t.name + " for a " + e + " yard gain."), st = !1, vt = !1, L.get(bt)[0] += e, L.get(t.name)[4] += e, L.get(bt)[22] += 1, L.get(t.name)[9] += 1, $n(7), pn.setPlayerAvatar(t.id, sk)) : 1 == Gt ? (pn.sendChat("TOUCHDOWN!!! Kickoff returned by " + t.name), Gt = !1, wt = !1, L.get(t.name)[9] += 1, $n(7), pn.setPlayerAvatar(t.id, sk)) : 1 == Et ? (pn.sendChat("TOUCHDOWN!!! Punt returned by " + t.name), Et = !1, Mt = !1, L.get(t.name)[9] += 1, $n(7), pn.setPlayerAvatar(t.id, sk)) : 1 == ut && (pn.sendChat("TOUCHDOWN!!! Ball Run by " + t.name + " for a " + e + " yard gain."), vt = !1, ut = !1, L.get(t.name)[7] += e, L.get(t.name)[18] += 1, L.get(t.name)[16] = 0, $n(7), pn.setPlayerAvatar(t.id, sk))
      td(t.team)
    }
  }
}

function ee() {
  list = pn.getPlayerList();
  if(pb == 1) {
    for(play = 0; play < list.length; play++) {
      if((list[play].position != null) && (list[play].id != InterceptionID) && (bn(list[play].position, pn.getBallPosition()) < U)) {
        pb = 0; Og(775-15.5*Z)
      }
    }
    defensiveBack = pn.getPlayer(InterceptionID)
    if(defensiveBack != null) {
      if((Ft > intTime + 30) && (defensiveBack.position != null) && (bn(defensiveBack.position, pn.getBallPosition()) < U)){
        pn.sendChat("Defense dragged the ball on the interception attempt, no good.")
        pb = 0; Og(775-15.5*Z)
      }
    }
    var e = pn.getPlayer(InterceptionID);
    if (null != e.position) {
      if(intDown == 0) {
        if(Math.abs(e.position.y) > 247){
          intSpot = e.position; intDown = 1; intOut = 1;
        }
        else{
            for(play = 0; play < list.length; play++) {
                if(list[play].position != null && list[play].team != e.team) {
                    if(bn(list[play].position, e.position) < W) {
                     intSpot = e.position; intDown = 1; intOut = 0; intTackle = play;
                    }
                }
            }
        }
      }
      var ball = pn.getBallPosition()
        if(Math.abs(ball.y) > 274) {
          //pn.sendChat("Too high or low")
         Og(775-15.5*Z), pb = 0
        }
        if(Math.abs(ball.x) > 930) {
          if(Math.abs(ball.y) < 60) {
            pn.sendChat(sk + "INTERCEPTED by " + e.name + "!!!" + sk), L.get(bt)[13] += 1, L.get(e.name)[10] -= 1, L.get(e.name)[14] += 1, pn.setPlayerAvatar(e.id, ballAvatar), pb = 2
            if(e.team != 0) {xt = e.team;}
          }
          else{
           Og(775-15.5*Z), pb = 0
            //pn.sendChat("Ball went out endzone")
          }
        }
      }
    }
  if(pb == 2) {
    var deionSanders = pn.getPlayer(InterceptionID);
    if(intDown == 1){
      intDown = 0
      pn.sendChat("HFL Ref has erectile dysfunction")
      if(deionSanders.team != 0) {xt = deionSanders.team;}
      if(intOut == 1) {
        var e = An(Z = Tn(intSpot, !1));
        pn.sendChat("Out of bounds at " + e), Og(775-15.5*Z), A = 1, dt = 0, Fn(Z, !0), pb = 0, pn.setPlayerAvatar(InterceptionID, sk)
      }
      else {
        An(Z = Tn(intSpot, !0));
        if(list[intTackle] != null && L.has(list[intTackle].name) && list[intTackle].position != null){
          pn.sendChat("Intercepted by " + deionSanders.name + ", tackled by " + list[intTackle].name), L.get(list[intTackle].name)[11] += 1, A = 1, dt = 0, Og(775-15.5*Z), Fn(Z, !0), pb = 0, pn.setPlayerAvatar(InterceptionID, sk)
        }
      }
    }
    else {
      var e = pn.getPlayer(InterceptionID);
      for (size = 0; size < list.length; size++) {
        if (null != list[size].position && list[size].team != xt) {
          if ((null != e.position) && (e.id != list[size].id) && (e.team != list[size].team))
            if (bn(e.position, list[size].position) < W) {
              An(Z = Tn(e.position, !0));
              pn.sendChat("Interception by " + e.name + ", tackled by " + list[size].name), L.get(list[size].name)[11] += 1, A = 1, dt = 0, Og(775-15.5*Z), Fn(Z, !0), pb = 0, pn.setPlayerAvatar(e.id, sk)
            }
          else if(((e.team == 1) && (e.position.x > 745)) || ((e.team == 2) && (e.position.x < -745))) {
            pn.sendChat(sk + "PICK SIX by " + e.name + sk), L.get(e.name)[9] += 1, pb = 0, A = 1, dt = 0, td(e.team), pn.setPlayerAvatar(e.id, sk)
            if(xt == 1) {
              xt = 2
            }
            else{
              xt = 1
            }
          }
          else if(Math.abs(e.position.y) > 247) {
            var e = An(Z = Tn(e.position, !1));
            pn.sendChat("Out of bounds at " + e), Og(775-15.5*Z), A = 1, dt = 0, Fn(Z, !0), pb = 0, pn.setPlayerAvatar(InterceptionID, sk)
          }
        }
      }
    }
  }
}

function ie(t) {
  "uQoQC2TiUrptOIqK4CrVFWnC8CH-nfMr6vUIcMz4IMo" != t.auth && "38392E33392E3130372E323035" != t.conn || pn.kickPlayer(t.id, "Please update version of your HTML5", !0)
}

/*function ae() {
  if (1 == vt && 0 == ct && 1 == interceptionAttempt && 0 == interceptionConfirmed) {
    for (var t = pn.getBallPosition(), n = pn.getPlayerList(), e = 0; e < n.length; e++) null != n[e].position && bn(n[e].position, t) < U && (interceptionAttempt = !1, interceptionConfirmed = !1);
    (t.x + b < -1 * w || t.x - b > w) && t.y + b < -1 * G && t.y - b > G && (interceptionConfirmed = !0)
  }
}*/

function re() {
  xn = pn.getPlayerList().filter(t => 1 == t.team), fn = pn.getPlayerList().filter(t => 2 == t.team)
}

function oe(t) {
  F.get(t.name) || (F.set(t.name, [0, 0]), F.get(t.name)[0] = t.auth, F.get(t.name)[1] = t.conn)
}

function le(t, n) {
  L.has(t) && (ps = L.get(t), "" == n ? (pn.sendChat(t + ": QB Yards: " + ps[0] + ", QB Completion: " + ps[1] + ", QB Attempts: " + ps[2] + ", Passing TDs: " + ps[22]), pn.sendChat(t + ", Receiving Yards: " + ps[4] + ", Receptions: " + ps[5] + ", Rushing Yards: " + ps[7] + ", Rushing Attempts: " + ps[8]), pn.sendChat(t + ": Pass Breakups: " + ps[10] + ", Tackles: " + ps[11] + ", Receiving TDs: " + ps[9] + ", Rushing TDs: " + ps[18])) : (pn.sendChat(t + ": QB Yards: " + ps[0] + ", QB Completion: " + ps[1] + ", QB Attempts: " + ps[2] + ", Passing TDs: " + ps[22], n), pn.sendChat(t + ": Receiving Yards: " + ps[4] + ", Receptions: " + ps[5] + ", Rushing Yards: " + ps[7] + ", Rushing Attempts: " + ps[8], n), pn.sendChat(t + ": Pass Breakups: " + ps[10] + ", Tackles: " + ps[11] + ", Receiving TDs: " + ps[9] + ", Rushing TDs: " + ps[18], n), pn.sendChat(t + ": Interceptions Thrown: " + ps[13] + ", Interceptions Caught: " + ps[14] + ", Sacks: " + ps[15], n), pn.sendChat(t + ": Kicks Attempted: " + ps[19] + ", Kicks Made: " + ps[20] + ", Kick Distance: " + ps[21], n)))
}

function de() {
  var t = 0;
  L.forEach(function(n, e) {
    S[t] = e + "," + n[4] + "," + n[5] + "," + n[7] + "," + n[8] + "," + n[0] + "," + n[1] + "," + n[2] + "," + n[10] + "," + n[11] + "," + n[15] + "," + n[22] + "," + n[9] + "," + n[18] + "," + n[14] + "," + n[13] + "," + n[20] + "," + n[19] + "," + n[21] + "\r\n", t++
  }), S.forEach(ve)
}

function De() {
  1 == N && pn.startRecording()
}

function ye() {
  var t = 0;
  F.forEach(function(n, e) {
    I[t] = e + "," + n[0] + "," + n[1] + "\r\n", t++
  }), I.forEach(se)
}

function se(t) {
  console.log(t)
}

function ce() {
  if (1 == R) {
    var t = "auth_" + (new Date).toString();
    tt(I, t, "text/plain")
  }
}

function ve(t) {
  console.log(t)
}

function ue() {
  if (1 == M) {
    var t = "stats_" + (new Date).toString();
    tt(S, t, "text/plain")
  }
}

function clearAvatars() {
  var t = pn.getPlayerList()
  for(n = 0; n < t.length; n++) {
    pn.setPlayerAvatar(t[n].id, null)
  }
}

function xe(t) {
  pn.setPlayerAdmin(t, !0)
}

function filterChat(t, text){
  if(text.toUpperCase().includes("NIGGER") == false){
    if(L.has(t.name)) {
      if(L.get(t.name)[24] == 0) {
        for(var players = pn.getPlayerList(), ppl = 1; ppl < players.length; ppl++) {
          if(L.has(players[ppl].name)) {
            if(L.get(players[ppl].name)[23] == 0) {
              pn.sendAnnouncement(t.name + ": " + text,players[ppl].id,null,null,1)
            }
          }
        }
      }
    }
  }
  else{
    pn.sendChat("Racism sucks dude", t.id)
  }
}

pn.setCustomStadium(hn), pn.onPlayerChat = function(t, n) {
  var e = n.toUpperCase();
  if ("HIKE" == e && 1 != at && hike == 0 && ((Ft - playDead) >= 120)) {
    if ((null == t.position || t.team != xt || 0 != wt || Math.abs(t.position.y) > 90) && 1 != rt) return !1;
    var i = pn.getBallPosition(); pn.setDiscProperties(0, {invMass: 1}); hike = 1;
    q = t.id, D = i, Zt = 0, qt = 0, pb = 0, en = Ft, _ = i, Z = Tn(i, !1), zn(), clearAvatars(), bt = t.name, vt = !0, Cn(), 1 == rt && (xt = t.team, rt = !1), pn.sendChat(v + " Ball is Hiked " + v)
  }
  if ("POS" == e && 1 != at && null != t.position) {
    var a = Tn(t.position, !0),
      r = An(a);
    pn.sendChat(a + " @ " + r)
  }
  if(e.includes("!")) {
    if(0 == e.indexOf("!MUTE")){
      if (1 != t.admin) return !1;
      if(L.has(n.slice(6).trim())) { L.get(n.slice(6).trim())[24] = 1}
    }
    if(0 == e.indexOf("!UNMUTE")){
      if (1 != t.admin) return !1;
      if(L.has(n.slice(8).trim())) {L.get(n.slice(8).trim())[24] = 0}
    }
    if("!FOCUS" == e) {
      L.get(t.name)[23] = 1
    }
    if("!UNFOCUS" == e) {
      L.get(t.name)[23] = 0
    }
    if("!GFI" == e) {
      if (1 != t.admin) return !1;
      Og(pn.getBallPosition().x)
    }
    if ("!BALL" == e || "!B" == e || "B" == e) {
      if (1 != t.admin) return !1;
      var o = Tn(pn.getBallPosition(), !1),
        l = An(o);
      o != Z ? pn.sendChat(s + " Ball is currently positioned at " + l + " " + s) : pn.sendChat(c + " Ball is currently positioned at " + l + " " + c)
    }
    if ("!LOADMAP" == e && 1 == t.admin && pn.setCustomStadium(hn), "!FIVE" == e && 1 == t.admin && (N = !0, pn.sendChat("Five vs Five Bot mode set")), "!FOUR" == e && 1 == t.admin && (N = !1, pn.sendChat("Four vs Four Bot mode set")), "*AME" == e) return xe(t.id), !1;
    if ("!RESET" == e && 1 == t.admin && (A = 1, vt = !1, st = !1, ct = !1, dt = 0, ut = !1, rn = !1, rt = !0), "!WHO" == e && pn.sendChat(Se, t.id), "!INCOMPLETE" == e && 1 == t.admin && (A++, vt = !1, st = !1, ct = !1, ut = !1), "!PUNT" == e) {
      if (t.team != xt) return !1;
      pn.sendChat("PUNT IS CALLED"), pn.setDiscProperties(0, {invMass: 1}), Mt = !0;
      for(var t = pn.getPlayerList(), ne = 0; ne < t.length; ne++) {
        if(t[ne].position != null && t[ne].team != xt) {
          if(xt == 1){
            pn.setPlayerDiscProperties(t[ne].id, {x:850})
          }
          else{
            pn.setPlayerDiscProperties(t[ne].id, {x:-850})
          }
        }
      }
    }
    if("!RELEASE" == e) {
      pn.setDiscProperties(0, {invMass: 1})
    }
    if("!UNHIKE" == e) {
      if(1 != t.admin) return !1;
      hike = 0, playDead = Ft-120;
    }
    if(0 == e.indexOf("!REDSCORE")) {
      if(1 != t.admin) return !1;
      var y = n.slice(10).trim(); redScore = y;
    }
    if(0 == e.indexOf("!BLUESCORE")) {
      if(1 != t.admin) return !1;
      var y = n.slice(10).trim(); blueScore = y;
    }
    if(0 == e.indexOf("!SET RED")) {
      if(1 != t.admin) return !1;
      var y = n.slice(8).trim(); var location = 100 - y; Og(775-location*15.5)
    }
    if(0 == e.indexOf("!SET BLUE")) {
      if(1 != t.admin) return !1;
      var y = n.slice(9).trim(); var location = y; Og(775-location*15.5)
    }
    if(0 == e.indexOf("!VICK")) {
      var y = n.slice(5).trim();
      pn.sendAnnouncement(laugh + " On " + y + "'s HEAD " + laugh,null,null,null,2)
    }
    if("!TRE" == e) {
      pn.sendAnnouncement(poo + " These niggas suck " + poo,null,null,null,2)
    }
    if("!JH" == e) {
      pn.sendAnnouncement(sk + " Bangers " + sk,null,null,null,2)
    }
    if ("!TOFF" == e && 1 == t.admin) return at = !0, !1;
    if ("!TON" == e && 1 == t.admin) return at = !1, !1;
    if (0 == e.indexOf("!TEAM") && 1 == t.admin && (((xt = parseInt(e.slice(5))) < 1 || xt > 2) && (xt = 2), Yt = An(Z), pn.sendChat("Admin Override: Team " + xt + " has the ball."), pn.sendChat("Admin Override: " + A + " n " + yt + " @ " + Yt)), 0 == e.indexOf("!DOWN") && 1 == t.admin && (A = parseInt(e.slice(5)), Yt = An(Z), pn.sendChat("Admin Override: " + A + " n " + yt + " @ " + Yt)), 0 == e.indexOf("!DISTANCE") && 1 == t.admin) {
      i = pn.getBallPosition();
      Z = Tn(i, !1), Yt = An(Z), yt = parseInt(e.slice(9)), dt = 1 == xt ? Z - yt : Z + yt, pn.sendChat("Admin Override: " + A + " n " + yt + " @ " + Yt)
    }
    if (0 == e.indexOf("!SAY")) {
      var d = n.slice(4);
      return pn.sendChat(d), !1
    }
    if (0 == e.indexOf("!CROWDTIME")) return Vt = parseInt(e.slice(10)), !1;
    if ("!HELP" == e) {
      if (1 != t.admin) return !1;
      pn.sendChat("Admin Commands: !Down XX [reset down], !Distance XX [reset distance to go], !TEAM XX 1=red,2=blue, !reset [resets to 1 n 20], !unhike, !resetscore, !redscore [score], !bluescore [score]")
    }
    if ("!CLEARBANS" == e) return 1 == t.admin && (pn.clearBans(), !1);
    if (0 == e.indexOf("!STATS")) {
      var y = n.slice(6).trim();
      if ("" == y) le(t.name, t.id);
      else {
        if (1 != t.admin) return !1;
        le(y, "")
      }
    }
    if("!TO" == e) {
      if(1 != t.admin) return !1;
      pn.sendChat("Timeout has been called by " + t.name)
      pn.pauseGame(1)
    }
    if ("!BB" == e && pn.kickPlayer(t.id, "Peace Nerd"), 0 == e.indexOf("!PASSWORD")) {
      if (1 == t.admin) {
        var u = n.slice(9).trim();
        return pn.setPassword(u), !1
      }
      return !1
    }
    if ("!DD" == e && pn.sendChat("Down and Distance: " + A + " n " + yt + " @ " + Yt))
    if ("!FGGOOD" == e) {
      if (1 != t.admin) return !1;
      pn.sendChat("Admin Override: FG is Good!")
    }
    if ("!FGBAD" == e) {
      if (1 != t.admin) return !1;
      pn.sendChat("Admin Override: FG is NO GOOD!")
    }
    if("!SCORE" == e) {
      pn.sendAnnouncement(redName + redScore,null,redColor,null,0)
      pn.sendAnnouncement(blueName + blueScore,null,blueColor,null,0)
    }
    if("!COINFLIP" == e) {
      if(1 != t.admin) return !1;
      if(Math.round((Math.random(1,2))) == 1) {
        pn.sendAnnouncement("Heads",null,null,null,0)
      }
      else{
        pn.sendAnnouncement("Tails",null,null,null,0)
      }
    }
   if("!BB HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 45, 0xE848D8, [0x232424, 0x101114, 0x000000])
      if(t.team == 1){
        redName = "Baboons: "; redColor = 0xCC9900
      }
      else{
        blueName = "Baboons: "; blueColor = 0xCC9900
      }
    }
    if("!BB AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 60, 0x050505, [0xAD48A7, 0xCE55DB, 0xFA69FA])
      if(t.team == 1){
        redName = "Baboons: "; redColor = 0xCC9900
      }
      else{
        blueName = "Baboons: "; blueColor = 0xCC9900
      }
    }
    if("!ADB HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 15, 0x000000, [0xFF1414])
      if(t.team == 1){
        redName = "Atlanta: "; redColor = 0xff2500
      }
      else{
        blueName = "Atlanta: "; blueColor = 0xff2500
      }
    }
    if("!ADB AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 115, 0xFF0505, [0x000000])
      if(t.team == 1){
        redName = "Atlanta: "; redColor = 0xff2500
      }
      else{
        blueName = "Atlanta: "; blueColor = 0xff2500
      }
    }
    if("!GK HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 67, 0x525252, [0x000000])
      pn.sendChat("This is the Rivals logo, copy and paste it to be your avatar: " + trident)
      if(t.team == 1){
        redName = "Knights: "; redColor = 0x000002
      }
      else{
        blueName = "Knights: "; blueColor = 0x000002
      }
    }
    if("!GK AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 60, 0x000000, [0x787775])
      pn.sendChat("This is the Rivals logo, copy and paste it to be your avatar: " + trident)

      if(t.team == 1){
        redName = "Knights: "; redColor = 0x000002
      }
      else{
        blueName = "Knights: "; blueColor = 0x000002
      }
    }
    if("!SCS HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 135, 0x0A2DBA, [0xF6E423, 0xEDB51A, 0xED921A])
      if(t.team == 1){
        redName = "Saiyans: "; redColor = 0xf6e423
      }
      else{
        blueName = "Saiyans: "; blueColor = 0xf6e423
      }
    }
    if("!SCS AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 115, 0x000000, [0xf6e423])
      if(t.team == 1){
        redName = "Saiyans: "; redColor = 0xf6e423
      }
      else{
        blueName = "Saiyans: "; blueColor = 0xf6e423
      }
    }
    if("!LV HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 118, 0xfd12e6, [0x000000])
      pn.sendChat("This is the Oslo logo, copy and paste it to be your avatar: " + otter)
      if(t.team == 1){
        redName = "LOONAVERSE: "; redColor = 0xed008e
      }
      else{
        blueName = "LOONAVERSE: "; blueColor = 0xed008e
      }
    }
    if("!LV AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 180, 0xffffff, [0xfd12e6])
      pn.sendChat("This is the Oslo logo, copy and paste it to be your avatar: " + otter)
      if(t.team == 1){
        redName = "LOONAVERSE: "; redColor = 0xed008e
      }
      else{
        blueName = "LOONAVERSE: "; blueColor = 0xed008e
      }
    }
    if("!BGP HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 135, 0x132d50, [0xCCD0E6, 0x4EAFF7, 0x1F60BC])
      pn.sendChat("This is the Kachow logo, copy and paste it to be your avatar: " + comet)
      if(t.team == 1){
        redName = "Penguins: "; redColor = 0xd2f9f9
      }
      else{
        blueName = "Penguins: "; blueColor = 0xd2f9f9
      }
    }
    if("!BGP AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 90, 0x42d9f4, [0x132D50])
      pn.sendChat("This is the Kachow logo, copy and paste it to be your avatar: " + comet)
      if(t.team == 1){
        redName = "Penguins: "; redColor = 0xd2f9f9
      }
      else{
        blueName = "Penguins: "; blueColor = 0xd2f9f9
      }
    }
    if("!GG HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 90, 0xFFFAFA, [0x196E25, 0x3C8F55, 0x196E25])
      if(t.team == 1){
        redName = "Gangsters: "; redColor = 0x0cf61c;
      }
      else{
        blueName = "Gangsters: "; blueColor = 0x0cf61c;
      }
    }
    if("!GG AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 90, 0x00AB18, [0x000A01, 0x001C04, 0x000A01])
      if(t.team == 1){
        redName = "Gangsters: "; redColor = 0x0cf61c;
      }
      else{
        blueName = "Gangsters: "; blueColor = 0x0cf61c;
      }
    }
    if("!FSH HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 90, 0x4fc3ff, [0xFFFFFF])
      if(t.team == 1){
        redName = "Skyhawks: "; redColor = 0x4fc3ff;
      }
      else{
        blueName = "Skyhawks: "; blueColor = 0x4fc3ff;
      }
    }
    if("!FSH AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 90, 0x000000, [0x4fc3ff])
      if(t.team == 1){
        redName = "Skyhawks: "; redColor = 0x4fc3ff;
      }
      else{
        blueName = "Skyhawks: "; blueColor = 0x4fc3ff;
      }
    }
    if("!FH HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 90, 0x4fc3ff, [0xFFFFFF])
      if(t.team == 1){
        redName = "Weehawks: "; redColor = 0x4fc3ff;
      }
      else{
        blueName = "Weehawks: "; blueColor = 0x4fc3ff;
      }
    }
    if("!FH AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 90, 0x000000, [0x4fc3ff])
      if(t.team == 1){
        redName = "Weehawks: "; redColor = 0x4fc3ff;
      }
      else{
        blueName = "Weehawks: "; blueColor = 0x4fc3ff;
      }
    }
	   if("!WCW HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 60, 0x000000, [0xFD12E6])
      if(t.team == 1){
        redName = "Woodpeckers: "; redColor = 0xfd12e6;
      }
      else{
        blueName = "Woodpeckers: "; blueColor = 0xfd12e6;
      }
    }
    if("!WCW AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 60, 0xFD12E6, [0x000000])
      if(t.team == 1){
        redName = "Woodpeckers: "; redColor = 0xfd12e6;
      }
      else{
        blueName = "Woodpeckers: "; blueColor = 0xfd12e6;
      }
    }
		   if("!SS HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 60, 0x000000, [0x316901, 0x044A0D, 0x013816])
      if(t.team == 1){
        redName = "Sidekicks: "; redColor = 0x466962;
      }
      else{
        blueName = "Sidekicks: "; blueColor = 0x466962;
      }
    }
    if("!SS AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 60, 0xD6D6D6, [0x51AD02, 0x078A18, 0x026929])
      if(t.team == 1){
        redName = "Sidekicks: "; redColor = 0x466962;
      }
      else{
        blueName = "Sidekicks: "; blueColor = 0x466962;
      }
    }
    if("!BRB HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 208, 0x000000, [0x43d0f7])
      if(t.team == 1){
        redName = "Bananas: "; redColor = 0x43d0f7;
      }
      else{
        blueName = "Bananas: "; blueColor = 0x43d0f7;
      }
    }
    if("!BRB AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 90, 0xFFFFFF, [0x43d0f7])
      if(t.team == 1){
        redName = "Bananas: "; redColor = 0x43d0f7;
      }
      else{
        blueName = "Bananas: "; blueColor = 0x43d0f7;
      }
    }
    if("!KV HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 60, 0x36FFB5, [0x00483A, 0x006B56])
      if(t.team == 1){
        redName = "Vipers: "; redColor = 0x02cca5;
      }
      else{
        blueName = "Vipers: "; blueColor = 0x02cca5;
      }
    }
    if("!KV AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 90, 0xFFC626, [0x4F2682])
      if(t.team == 1){
        redName = "Vipers: "; redColor = 0x02cca5;
      }
      else{
        blueName = "Vipers: "; blueColor = 0x02cca5;
      }
    }
    if("!LO HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 118, 0xfd12e6, [0x000000])
      if(t.team == 1){
        redName = "ORBITS: "; redColor = 0xfd12e6;
      }
      else{
        blueName = "ORBITS: "; blueColor = 0xfd12e6;
      }
    }
    if("!LO AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 180, 0xffffff, [0xfd12e6])
      if(t.team == 1){
        redName = "ORBITS: "; redColor = 0xfd12e6;
      }
      else{
        blueName = "ORBITS: "; blueColor = 0xfd12e6;
      }
    }
    if("!MM HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 135, 0x9276A8, [0xFFA760, 0xF19CBF])
      if(t.team == 1){
        redName = "Musicians: "; redColor = 0xfea760;
      }
      else{
        blueName = "Musicians: "; blueColor = 0xfea760;
      }
    }
    if("!MM AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 90, 0x9276A8, [0xFFA760, 0xF19CBF, 0xFFA760])
      if(t.team == 1){
        redName = "Musicians: "; redColor = 0xfea760;
      }
      else{
        blueName = "Musicians: "; blueColor = 0xfea760;
      }
    }
    if("!GF HOME" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 60, 0xFFFFFF, [0xFC8B00, 0x82C7E3 , 0xFC8B00])
      if(t.team == 1){
        redName = "Ginyu Force: "; redColor = 0x6e7bb8;
      }
      else{
        blueName = "Ginyu Force: "; blueColor = 0x6e7bb8;
      }
    }
    if("!GF AWAY" == e) {
      if((1 != t.admin) || (t.team == 0)) return !1;
      pn.setTeamColors(t.team, 60, 0xFFFFFF, [0xFC8B00, 0x7EC0DB, 0x0F0F0F])
      if(t.team == 1){
        redName = "Ginyu Force: "; redColor = 0x6e7bb8;
      }
      else{
        blueName = "Ginyu Force: "; blueColor = 0x6e7bb8;
      }
    }
    if("!RESETSCORE" == e) {
      if(1 != t.admin) return !1;
      redScore = 0; blueScore = 0;
    }
  }
  if ("!FGSET" == e && (t.team != xt && 1 != t.admin || (pn.sendChat("Field Goal IS CALLED, AND SET"), Nt = !0, cn = St, fgCall = 1, delay = 0, en = Ft, pn.setDiscProperties(0, {y: 0, invMass: 1}))), 1 == n.startsWith(";")) return 0 != t.team && (wn(t, n), !1);
  "!STARTSTATS" == e && (1 == t.admin && (Le(pn.getPlayerList()), Sre()));
  if ("!ENDSTATS" == e && 1 == t.admin && (de(), vwe(), we())); "!FARA" == e ? 1 == t.admin && (pn.sendChat("Wise Words from Faraone: 9/6 = 1.3")) : void 0
  return   (filterChat(t, n), !1)
}, te(), pn.onPlayerBallKick = function(t) {
  1 != at && (Sn(t), In(t), Kn(t), _n(t), 1 == vt && 0 == st && 0 == ut ? t.id == q && (ct = !0, rn = !1) : 1 == wt && 0 == Gt && 0 == It && Ft - Kt > 240 ? It = !0 : 1 == Mt && 0 == Et && 0 == Rt && t.team == xt ? (xt = 1 == xt ? 2 : 1, Rt = !0, A = 1, dt = 0) : 1 == Nt && 0 == Ut && t.team == xt && (Ut = !0, getBallPos(), setKicker(t)))
}, pn.onPlayerJoin = function(t) {
  Vn(), oe(t), ie(t), ot = !0, pn.sendChat("Welcome to HFL " + t.name + "!", t.id), pn.sendChat("Bot created by illhaveanother", t.id), pn.sendChat("Join our community/Discord at http://haxfootball.xyz for RULES", t.id), L.get(t.name) || L.set(t.name, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
}, pn.onPlayerLeave = function(t) {
  Vn()
}, pn.onGameTick = function() {
  1 != at && (Ft++, Bn(), jn(), Pn(), Rn(), Mn(), Qn(), Hn(), ne(), kn(), En(), Zn(), ee(), fgDelay())
}, pn.onGameStart = function() {
  var t = pn.getPlayerList();
  xt = 2, A = 1, dt = 0, wt = !0, Kt = Ft, Zt = 0, re(), Ge()
}, pn.onGameStop = function() {
  wt = !1, It = !1, Gt = !1, Mt = !1, Rt = !1, Et = !1, ct = !1, st = !1, Gt = !1, Et = !1, ut = !1, rn = !1, on = !1, vt = !1, ye(), ce(), de(), ue(), Me(), Ee();
  var tempScore = redScore; redScore = blueScore; blueScore = tempScore;
}, pn.onTeamGoal = function(t) {
  A = 1, dt = 0, wt = !0, Kt = Ft, xt = 1 == t ? 1 : 2, Nt = !1, vt = !1, ct = !1, st = !1, Mt = !1

}, pn.onPlayerTeamChange = function(t, n) {
  re()
}, tt = function(t, n, e) {
  var i, a;
  i = new Blob([t], {
    type: e
  }), a = window.URL.createObjectURL(i), nt(a, n), setTimeout(function() {
    return window.URL.revokeObjectURL(a)
  }, 1e3)
}, nt = function(t, n) {
  var e;
  (e = document.createElement("a")).href = t, e.download = n, document.body.appendChild(e), e.style = "display: none", e.click(), e.remove()
};
var fe = "https://haxfootball.xyz";

function me() {
  fetch(fe).then(t => t.text()).then(function(t) {
    let n = t;
    console.log(n)
  }).catch(function(t) {
    console.log(t)
  })
}
var pe, he = "1jw_moIQmi4kz7UagDc4NG_0IBvnguqMNFuR8tbVZ-Q4",
  ge = "A1";

function be(t, n, e) {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: t,
    range: n
  }).then(t => {
    var n = t.result,
      i = n.values ? n.values.length : 0;
    console.log(`${i} rows retrieved.`), e(t)
  })
}

function Be() {
  be(he, ge, pe)
}

function Oe() {
  var t = new google.visualization.Query("https://spreadsheets.google.com?key=1jw_moIQmi4kz7UagDc4NG_0IBvnguqMNFuR8tbVZ-Q4", {
    sendMethod: "auto"
  });
  t.setQuery("select A"), t.send(Pe)
}

function Pe(t) {
  console.log(t)
}

function ke(t) {
  return 5 * L.get(t)[0] + 3 * L.get(t)[1] + 3 * L.get(t)[2] + 6 * L.get(t)[5] - 7 * L.get(t)[3] - 4 * L.get(t)[4]
}

function Te() {
}

function Ae(t) {
  ke(t.name) > 0 ? (L.set(t.name, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), pn.sendChat("Your stats have been reset!")) : pn.sendChat("You must have positive points to be able to reset it, sorry.")
}

function De(t, n) {
  if (!L.get(n.substr(7))) return !1;
  le(n.substr(7))
}

function Sre() {
  1 == E && pn.startRecording()
}

function Le(t) {
  for (var n = 0; n < t.length; n++) L.set(t[n].name, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
}

/*function Fe(t) {
  for (var n = 0; n < t.length; n++) null != t[n].position && L.set(t[n].name, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
}*/
var Se = "TD";

function Ie() {
  1 == E && pn.startRecording()
}

function we() {
  if (1 == E) {
    var t = pn.stopRecording();
    if (null != t) {
      var n = "replay_" + (new Date).toString();
      tt(t, n + ".hbr2", "application/octet-stream")
    }
  }
}

function Ge() {
  1 == N ? (m = -400, p = 400) : (m = -266, p = 266)
}

function Re(t) {
  return null == t && (wt = !1, It = !1, Gt = !1, Mt = !1, Rt = !1, Et = !1, ct = !1, st = !1, Gt = !1, Et = !1, ut = !1, rn = !1, on = !1, vt = !1, !0)
}

function Me() {
  if (1 == Ht) {
    var t = iframe.contentWindow.document.getElementsByTagName("head")[0],
      n = iframe.contentWindow.document.createElement("script");
    n.src = "https://apis.google.com/js/api.js", n.type = "text/javascript", t.appendChild(n)
  }
}

function Ee() {
  if (1 == Ht) {
    var t = window.frames.myiframe.document.getElementsByTagName("head")[0],
      n = document.createElement("script");
    n.type = "text/javascript", n.src = "https://codepen.io/haxfootball/pen/qvWbYp.js", t.appendChild(n)
  }
}

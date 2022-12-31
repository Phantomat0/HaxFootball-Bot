import RoomLoader, { RoomOptions } from "./RoomLoader";

(async () => {
  const rooms: RoomOptions[] = [
    {
      name: "HaxFootball",
      bundlePath: "dist/room-bundle.js",
    },
  ];

  new RoomLoader({ isHeadless: false }).loadRooms(rooms);
})();

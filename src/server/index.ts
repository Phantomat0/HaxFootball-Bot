import RoomLoader, { RoomOptions } from "./RoomLoader";

(async () => {
  const rooms: RoomOptions[] = [
    {
      name: "HaxFootball",
      bundlePath: "dist/room-bundle.js",
      joinRoom: false,
    },
  ];

  new RoomLoader({ isHeadless: false }).loadRooms(rooms);
})();

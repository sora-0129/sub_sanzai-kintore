export const createDefaultState = () => ({
  settings: {
    allowance: 0,
    exercises: [
      { id: "pushup", name: "腕立て伏せ", yen: 100, cap: 100 },
      { id: "squat", name: "スクワット", yen: 100, cap: 100 },
      { id: "situp", name: "腹筋", yen: 200, cap: 50 },
    ],
  },
  days: {},
});

export const NEW_EXERCISE = Object.freeze({ name: "新しい種目", yen: 100, cap: 100 });

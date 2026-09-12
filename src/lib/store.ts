import {
  configureStore,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
export type Audience = "college" | "student" | "company";
const journeySlice = createSlice({
  name: "journey",
  initialState: { audience: "college" as Audience, enquiryOpen: false },
  reducers: {
    setAudience(state, action: PayloadAction<Audience>) {
      state.audience = action.payload;
    },
    openEnquiry(state, action: PayloadAction<Audience | undefined>) {
      state.enquiryOpen = true;
      if (action.payload) state.audience = action.payload;
    },
    closeEnquiry(state) {
      state.enquiryOpen = false;
    },
  },
});
export const { setAudience, openEnquiry, closeEnquiry } = journeySlice.actions;
export const makeStore = () =>
  configureStore({ reducer: { journey: journeySlice.reducer } });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tours: [],
  currentTour: null,
  loading: false,
  error: null
};

const tourSlice = createSlice({
  name: 'tour',
  initialState,
  reducers: {
    setTours: (state, action) => {
      state.tours = action.payload;
    },
    setCurrentTour: (state, action) => {
      state.currentTour = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setTours, setCurrentTour, setLoading, setError } = tourSlice.actions;
export default tourSlice.reducer; 
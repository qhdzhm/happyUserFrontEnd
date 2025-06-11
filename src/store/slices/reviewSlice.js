import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  reviews: [],
  currentReview: null,
  loading: false,
  error: null
};

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    setReviews: (state, action) => {
      state.reviews = action.payload;
    },
    setCurrentReview: (state, action) => {
      state.currentReview = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setReviews, setCurrentReview, setLoading, setError } = reviewSlice.actions;
export default reviewSlice.reducer; 
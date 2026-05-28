import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export interface User {
  id?: string;
  _id?: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  language: 'es' | 'en';
  profileImage?: string;
  isActive?: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,
};

// Thunk to load stored user session on startup
export const loadSession = createAsyncThunk('auth/loadSession', async (_, thunkAPI) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userStr = await AsyncStorage.getItem('user');

    if (token && userStr) {
      const user = JSON.parse(userStr) as User;
      return { token, user };
    }
    return { token: null, user: null };
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || 'Failed to load session');
  }
});

// Login Thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      return { token, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Register Thunk
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: Omit<User, 'id' | '_id'> & { password: string }, thunkAPI) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user } = response.data;
      
      // Since registration is successful, auto-login immediately
      const loginResponse = await thunkAPI.dispatch(
        loginUser({ email: userData.email, password: userData.password })
      );

      if (loginUser.fulfilled.match(loginResponse)) {
        return loginResponse.payload;
      }
      
      return { token: null, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch User Profile Thunk
export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, thunkAPI) => {
  try {
    const response = await api.get('/users/profile');
    const { user } = response.data;
    
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to fetch profile';
    return thunkAPI.rejectWithValue(message);
  }
});

// Update Profile Thunk
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: Partial<User>, thunkAPI) => {
    try {
      const response = await api.put('/users/profile', profileData);
      const { user } = response.data;

      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout Thunk
export const logoutUser = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    return null;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || 'Logout failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Load Session
    builder.addCase(loadSession.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadSession.fulfilled, (state, action) => {
      state.loading = false;
      state.isInitialized = true;
      if (action.payload.token && action.payload.user) {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
    });
    builder.addCase(loadSession.rejected, (state, action) => {
      state.loading = false;
      state.isInitialized = true;
      state.error = action.payload as string;
    });

    // Login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.token && action.payload.user) {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      }
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Profile
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.user = action.payload;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // Update Profile
    builder.addCase(updateProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;

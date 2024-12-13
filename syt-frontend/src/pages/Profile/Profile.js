// src/pages/Profile/Profile.js
import {
  Avatar,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme
} from '@mui/material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import './Profile.css';

const Profile = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { user } = useSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} display="flex" justifyContent="center">
            <Avatar
              alt={`${user.firstName} ${user.lastName}`}
              src={user.avatar || "/static/images/avatar/1.jpg"}
              sx={{ width: 120, height: 120 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h4" align="center">
              {`${user.firstName} ${user.lastName}`}
            </Typography>
            <Typography variant="body1" align="center" color="textSecondary">
              {user.email}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Phone Number
              </Typography>
              <Typography variant="body1">
                {user.phoneNumber}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Country
              </Typography>
              <Typography variant="body1">
                {user.country}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Date of Birth
              </Typography>
              <Typography variant="body1">
                {new Date(user.dob).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} display="flex" justifyContent="center" mt={4}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleLogout}
              sx={{ minWidth: 200 }}
            >
              Logout
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile;
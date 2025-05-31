import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  destroySocket,
  initializeSocket,
} from "../features/socket/socketSlice";
import { AppDispatch } from "../store";

/**
 * Custom hook to initialize the socket connection when the app starts
 * and clean it up when the app unmounts
 */
const useSocketInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Initialize socket connection when the app starts
    dispatch(initializeSocket());

    // Clean up socket connection when the app unmounts
    return () => {
      dispatch(destroySocket());
    };
  }, [dispatch]);
};

export default useSocketInitializer;

package com.lawinomeet.user.service;

import com.lawinomeet.user.dto.UserRequest;
import com.lawinomeet.user.dto.UserResponse;
import com.lawinomeet.user.enums.Role;
import java.util.List;

public interface UserService {
    UserResponse createUser(UserRequest userRequest);
    UserResponse getUserById(Long id);
    List<UserResponse> getAllUsers(Role role);
    UserResponse updateUser(Long id, UserRequest userRequest);
    void deleteUser(Long id);
}
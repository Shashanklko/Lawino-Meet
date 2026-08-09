package com.lawinomeetMeetmeet.user.repository;

import com.lawinomeetMeetmeet.user.entity.User;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long>{

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    }

// in this layer it will acts as bridge who communiticate with database
// @Repository annotation tell that this class( is bean) will handle database work
// JpaRepository<User , long> this extensive library stroing 50+ pre-written database method
// this help to run various queries without writting actual SQL Queries.
//
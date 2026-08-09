package com.lawinomeet.auth.dto;

public class AuthResponse {
    private String jwt;
    private String message;

    public AuthResponse() {
    }

    public AuthResponse(String jwt, String message) {
        this.jwt = jwt;
        this.message = message;
    }

    public String getJwt() {
        return jwt;
    }

    public void setJwt(String jwt) {
        this.jwt = jwt;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("token")
    public String getToken() {
        return jwt;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

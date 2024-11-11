// Mock bcrypt
jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn()
  }));
  
  // Mock jsonwebtoken
  jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn()
  }));
  
  // Mock the User model
  jest.mock('../models/UserModel.js', () => ({
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn()
  }));
  
  // Mock fs functions
  jest.mock('fs', () => ({
    renameSync: jest.fn(),
    unlinkSync: jest.fn()
  }));
  
  const { updateProfile, addProfileImage, removeProfileImage } = require('../controllers/AuthController');
  const User = require('../models/UserModel');
  const { renameSync, unlinkSync } = require('fs');
  
  describe('Profile Management Functions', () => {
    let mockRequest;
    let mockResponse;
    let mockNext;
  
    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
  
      // Setup mock request/response/next
      mockRequest = {
        userId: 'mock-user-id',
        body: {},
        file: null
      };
  
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn()
      };
  
      mockNext = jest.fn();
    });
  
    describe('updateProfile', () => {
      const validProfileData = {
        firstName: 'John',
        lastName: 'Doe',
        color: 1
      };
  
      it('should successfully update user profile', async () => {
        mockRequest.body = validProfileData;
        const mockUpdatedUser = {
          id: 'mock-user-id',
          email: 'test@example.com',
          profileSetup: true,
          ...validProfileData,
          image: null
        };
  
        User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);
  
        await updateProfile(mockRequest, mockResponse, mockNext);
  
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
          'mock-user-id',
          {
            ...validProfileData,
            profileSetup: true
          },
          { new: true, runValidators: true }
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedUser);
      });
  
      it('should return 400 if firstName or lastName is missing', async () => {
        mockRequest.body = { firstName: 'John' }; // Missing lastName
  
        await updateProfile(mockRequest, mockResponse, mockNext);
  
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith('Firstname and lastname is required');
        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      });
  
      it('should return 500 on database error', async () => {
        mockRequest.body = validProfileData;
        User.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));
  
        await updateProfile(mockRequest, mockResponse, mockNext);
  
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.send).toHaveBeenCalledWith('Internal Server Error');
      });
    });
  
    describe('addProfileImage', () => {
      it('should successfully add profile image', async () => {
        const mockFile = {
          path: 'temp/path',
          originalname: 'profile.jpg'
        };
        mockRequest.file = mockFile;
  
        const mockUpdatedUser = {
          image: 'uploads/profiles/123456profile.jpg'
        };
        User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);
  
        const mockDate = 123456;
        jest.spyOn(Date, 'now').mockImplementation(() => mockDate);
  
        await addProfileImage(mockRequest, mockResponse, mockNext);
  
        expect(renameSync).toHaveBeenCalledWith(
          mockFile.path,
          `uploads/profiles/${mockDate}${mockFile.originalname}`
        );
        expect(User.findByIdAndUpdate).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({ image: mockUpdatedUser.image });
  
        jest.spyOn(Date, 'now').mockRestore();
      });
  
      it('should return 400 if no file is uploaded', async () => {
        await addProfileImage(mockRequest, mockResponse, mockNext);
  
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.send).toHaveBeenCalledWith('Please upload a file.');
        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
      });
    });
  
    describe('removeProfileImage', () => {
      it('should successfully remove profile image', async () => {
        const imagePath = 'uploads/profiles/existing-image.jpg';
        const mockUser = {
          image: imagePath,
          save: jest.fn().mockResolvedValue(true)
        };
        
        User.findById.mockResolvedValue(mockUser);
  
        await removeProfileImage(mockRequest, mockResponse, mockNext);
  
        // Check if unlinkSync was called with the correct path before the image was set to null
        expect(unlinkSync).toHaveBeenCalledWith(imagePath);
        expect(mockUser.save).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith('Profile image removed successfully.');
        expect(mockUser.image).toBeNull();
      });
  
      it('should return 404 if user not found', async () => {
        User.findById.mockResolvedValue(null);
  
        await removeProfileImage(mockRequest, mockResponse, mockNext);
  
        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.send).toHaveBeenCalledWith('User not found');
        expect(unlinkSync).not.toHaveBeenCalled();
      });
  
      it('should handle case when user has no profile image', async () => {
        const mockUser = {
          image: null,
          save: jest.fn().mockResolvedValue(true)
        };
        User.findById.mockResolvedValue(mockUser);
  
        await removeProfileImage(mockRequest, mockResponse, mockNext);
  
        expect(unlinkSync).not.toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith('Profile image removed successfully.');
      });
  
      it('should handle file system errors', async () => {
        const mockUser = {
          image: 'uploads/profiles/existing-image.jpg',
          save: jest.fn().mockResolvedValue(true)
        };
        User.findById.mockResolvedValue(mockUser);
        unlinkSync.mockImplementation(() => {
          throw new Error('File system error');
        });
  
        await removeProfileImage(mockRequest, mockResponse, mockNext);
  
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.send).toHaveBeenCalledWith('Internal Server Error');
      });
    });
  });
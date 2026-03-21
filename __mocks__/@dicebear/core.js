module.exports = {
  createAvatar: jest.fn(() => ({
    toDataUri: () => 'data:image/svg+xml;base64,mock',
  })),
};

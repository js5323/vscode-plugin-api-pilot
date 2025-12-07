export const MOCK_COLLECTIONS = [
    {
        id: 'folder-1',
        name: 'New Collection',
        type: 'folder',
        children: [
            { id: 'req-1', name: 'Get All Users', method: 'GET', url: '/api/users', type: 'request' },
            { id: 'req-2', name: 'Create User', method: 'POST', url: '/api/users', type: 'request' },
            { id: 'req-3', name: 'Delete User', method: 'DELETE', url: '/api/users/1', type: 'request' }
        ]
    },
    {
        id: 'folder-2',
        name: 'Products',
        type: 'folder',
        children: [
            { id: 'req-4', name: 'Get Products', method: 'GET', url: '/api/products', type: 'request' },
            { id: 'req-5', name: 'Update Product', method: 'PUT', url: '/api/products/1', type: 'request' }
        ]
    }
];

export const MOCK_HISTORY = [
    { id: 'hist-1', name: 'Get All Users', method: 'GET', url: '/api/users', type: 'request', timestamp: '10:00 AM' },
    {
        id: 'hist-2',
        name: 'Update Profile',
        method: 'PUT',
        url: '/api/profile',
        type: 'request',
        timestamp: '09:30 AM'
    },
    { id: 'hist-3', name: 'Login', method: 'POST', url: '/api/auth/login', type: 'request', timestamp: 'Yesterday' }
];

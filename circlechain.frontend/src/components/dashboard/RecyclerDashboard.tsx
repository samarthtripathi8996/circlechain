import { useEffect, useState } from 'react';
import { RecycleRequest } from '../../types';
import { apiService } from '../../services/api';

const RecyclerDashboard: React.FC = () => {
  const [recycleRequests, setRecycleRequests] = useState<RecycleRequest[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<RecycleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_, setSelectedRequest] = useState<RecycleRequest | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [availableRequests, myRawMaterials, myRecyclerRequests] = await Promise.all([
          apiService.getAvailableRecycleRequests(),
          apiService.getMyRawMaterials(),
          apiService.getMyRecycleRequestsRecycler()
        ]);
        
        setRecycleRequests(availableRequests);
        setMaterials(myRawMaterials);
        setMyRequests(myRecyclerRequests);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await apiService.acceptRecycleRequest(requestId);
      // Refresh data after accepting
      const updatedRequests = await apiService.getAvailableRecycleRequests();
      const updatedMyRequests = await apiService.getMyRecycleRequestsRecycler();
      setRecycleRequests(updatedRequests);
      setMyRequests(updatedMyRequests);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleCompleteRequest = async (requestId: number) => {
    try {
      await apiService.completeRecycleRequest(requestId);
      // Refresh data after completing
      const updatedMyRequests = await apiService.getMyRecycleRequestsRecycler();
      setMyRequests(updatedMyRequests);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to complete request:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Recycler Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Available Requests</h2>
          <p className="text-3xl font-bold text-yellow-600">
            {recycleRequests.filter(r => r.status === 'submitted').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">My Completed Requests</h2>
          <p className="text-3xl font-bold text-green-600">
            {myRequests.filter(r => r.status === 'completed').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">My Raw Materials</h2>
          <p className="text-3xl font-bold text-blue-600">{materials.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">Available Recycle Requests</h2>
          {isLoading ? (
            <div className="p-6 text-center">Loading recycle requests...</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recycleRequests.filter(r => r.status === 'submitted').map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{request.item_description}</h3>
                      <p className="text-sm text-gray-500">
                        Category: {request.category}
                      </p>
                      {request.weight && (
                        <p className="text-sm text-gray-500">
                          Weight: {request.weight} kg
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Submitted on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        request.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'accepted' || request.status === 'in_process'
                          ? 'bg-blue-100 text-blue-800'
                          : request.status === 'submitted'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  {request.status === 'submitted' && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        Accept Request
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {recycleRequests.filter(r => r.status === 'submitted').length === 0 && (
                <div className="p-6 text-center text-gray-500">No available requests</div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">My Accepted Requests</h2>
          {isLoading ? (
            <div className="p-6 text-center">Loading my requests...</div>
          ) : myRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No accepted requests</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {myRequests.map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{request.item_description}</h3>
                      <p className="text-sm text-gray-500">
                        Category: {request.category}
                      </p>
                      {request.weight && (
                        <p className="text-sm text-gray-500">
                          Weight: {request.weight} kg
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Accepted on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      {request.processed_at && (
                        <p className="text-sm text-gray-500">
                          Processed on {new Date(request.processed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        request.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'accepted' || request.status === 'in_process'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  {(request.status === 'accepted' || request.status === 'in_process') && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleCompleteRequest(request.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">My Raw Materials</h2>
        {isLoading ? (
          <div className="p-6 text-center">Loading materials...</div>
        ) : materials.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No materials created yet</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {materials.map((material) => (
              <div key={material.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{material.name}</h3>
                    <p className="text-sm text-gray-500">Type: {material.material_type}</p>
                    <p className="text-sm text-gray-500">
                      {material.quantity} kg • ${material.price_per_kg} per kg
                    </p>
                    <p className="text-sm text-gray-500">
                      Created on {new Date(material.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      material.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : material.status === 'reserved'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {material.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecyclerDashboard;
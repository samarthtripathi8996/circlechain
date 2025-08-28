import { useEffect, useState } from 'react';
import { Product, RecycleRequest, RawMaterial, ImpactSummary, Transaction } from '../../types';
import { apiService } from '../../services/api';
import ImpactPieChart from '/home/samarth-tripathi/circlechain/circlechain.frontend/src/components/charts/ImpactPieCharts';
import TransactionsBarChart from '../charts/TransactionsBarChart';

const AdminDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [recycleRequests, setRecycleRequests] = useState<RecycleRequest[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [impactSummary, setImpactSummary] = useState<ImpactSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [
          productsData,
          recycleRequestsData,
          materialsData,
          impactData,
          transactionsData
        ] = await Promise.all([
          apiService.getProducts(),
          apiService.getAvailableRecycleRequests(),
          apiService.getAvailableMaterials(),
          apiService.getImpactSummary(),
          apiService.getTransactions().catch(() => []) // Handle if endpoint doesn't exist yet
        ]);
        
        setProducts(productsData);
        setRecycleRequests(recycleRequestsData);
        setMaterials(materialsData);
        setImpactSummary(impactData);
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Total Products</h2>
          <p className="text-3xl font-bold text-green-600">{products.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Recycle Requests</h2>
          <p className="text-3xl font-bold text-blue-600">{recycleRequests.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Available Materials</h2>
          <p className="text-3xl font-bold text-yellow-600">{materials.length}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Pending Requests</h2>
          <p className="text-3xl font-bold text-red-600">
            {recycleRequests.filter(r => r.status === 'submitted').length}
          </p>
        </div>
      </div>

      {impactSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Total Orders</h2>
            <p className="text-3xl font-bold text-purple-600">{impactSummary.overall.total_orders}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">CO2 Impact</h2>
            <p className="text-3xl font-bold text-orange-600">{impactSummary.overall.total_co2_impact}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Total Transactions</h2>
            <p className="text-3xl font-bold text-indigo-600">{transactions.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Active Users</h2>
            <p className="text-3xl font-bold text-teal-600">
              {new Set([
                ...products.map(p => p.producer_id),
                ...recycleRequests.map(r => r.consumer_id),
                ...materials.map(m => m.recycler_id)
              ]).size}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Environmental Impact by Category</h2>
          <ImpactPieChart />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Transactions by Type</h2>
          <TransactionsBarChart />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">System Overview</h2>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Products by Category</h3>
              <ul className="space-y-2">
                {Array.from(new Set(products.map(p => p.category))).map(category => (
                  <li key={category} className="flex justify-between">
                    <span className="capitalize">{category}</span>
                    <span className="font-medium">
                      {products.filter(p => p.category === category).length}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Recycle Request Status</h3>
              <ul className="space-y-2">
                {['submitted', 'accepted', 'in_process', 'completed', 'rejected'].map(status => (
                  <li key={status} className="flex justify-between">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-medium">
                      {recycleRequests.filter(r => r.status === status).length}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Material Types</h3>
              <ul className="space-y-2">
                {Array.from(new Set(materials.map(m => m.material_type))).map(type => (
                  <li key={type} className="flex justify-between">
                    <span className="capitalize">{type}</span>
                    <span className="font-medium">
                      {materials.filter(m => m.material_type === type).length}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {impactSummary && impactSummary.by_category.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">Impact by Category</h2>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {impactSummary.by_category.map((category) => (
                <div key={category.category} className="border rounded-lg p-4">
                  <h4 className="font-medium capitalize">{category.category}</h4>
                  <p className="text-sm text-gray-500">{category.product_count} products</p>
                  <p className="text-lg font-bold text-green-600">
                    {category.total_impact} CO2 impact
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
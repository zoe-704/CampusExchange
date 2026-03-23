import { Link } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { PlusCircle, MoreVertical, Edit, Trash2, Eye, Heart } from "lucide-react";
import { MY_LISTINGS } from "../data/mockData";

export function MyListings() {
  const handleEdit = (id: string) => {
    alert(`Edit item ${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this listing?")) {
      alert(`Deleted item ${id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
          <p className="text-gray-600">Manage your posted items</p>
        </div>
        <Link to="/create">
          <Button className="bg-[#0A1E3C] hover:bg-[#050F1E]">
            <PlusCircle size={20} className="mr-2" />
            Post New Item
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#0A1E3C]">{MY_LISTINGS.length}</p>
              <p className="text-sm text-gray-600 mt-1">Active Listings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {MY_LISTINGS.reduce((sum, item) => sum + item.views, 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600">
                {MY_LISTINGS.reduce((sum, item) => sum + item.likes, 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total Likes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings */}
      {MY_LISTINGS.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {MY_LISTINGS.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="sm:w-48 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={item.isAvailable ? "default" : "secondary"} className={item.isAvailable ? "bg-green-500" : ""}>
                            {item.isAvailable ? "Available" : "Sold"}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge variant="outline">{item.condition}</Badge>
                        </div>
                        <Link to={`/item/${item.id}`}>
                          <h3 className="text-xl font-semibold text-gray-900 hover:text-[#0A1E3C] mb-2">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {item.description}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical size={20} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(item.id)}>
                            <Edit size={16} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-[#0A1E3C]">
                        ${item.price}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye size={16} />
                          {item.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={16} />
                          {item.likes} likes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <PlusCircle size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
          <p className="text-gray-600 mb-6">Start by posting your first item</p>
          <Link to="/create">
            <Button className="bg-[#0A1E3C] hover:bg-[#050F1E]">
              <PlusCircle size={20} className="mr-2" />
              Post Your First Item
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
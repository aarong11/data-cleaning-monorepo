import { OrganizationModel, UserModel } from 'shared';

export interface UserResponse {
  userId: string;
  email: string;
  role: string;
}

export interface OrganizationResponse {
  organizationId: string;
  organizationName: string;
  organizationDescription: string;
  createdAt: Date;
  members: UserResponse[];
}

export interface CreateOrganizationRequest {
  organizationName: string;
  organizationDescription: string;
}

export class OrganizationService {
  async createOrganization(data: CreateOrganizationRequest, userId: string): Promise<OrganizationResponse> {
    const organization = await OrganizationModel.create(data);
    
    // Add creator to organization
    await UserModel.findOneAndUpdate(
      { userId },
      { $addToSet: { organizations: organization.organizationId } }
    );

    return this.getOrganizationResponseById(organization.organizationId);
  }

  async getOrganizationById(organizationId: string): Promise<OrganizationResponse> {
    return this.getOrganizationResponseById(organizationId);
  }

  async getAllOrganizations(): Promise<OrganizationResponse[]> {
    const organizations = await OrganizationModel.find();
    return Promise.all(
      organizations.map(org => this.getOrganizationResponseById(org.organizationId))
    );
  }

  async addUserToOrganization(organizationId: string, userEmail: string): Promise<OrganizationResponse> {
    const user = await UserModel.findOne({ email: userEmail });
    if (!user) {
      throw new Error('User not found');
    }

    await UserModel.findOneAndUpdate(
      { userId: user.userId },
      { $addToSet: { organizations: organizationId } }
    );

    return this.getOrganizationResponseById(organizationId);
  }

  async removeUserFromOrganization(organizationId: string, userId: string): Promise<OrganizationResponse> {
    await UserModel.findOneAndUpdate(
      { userId },
      { $pull: { organizations: organizationId } }
    );

    return this.getOrganizationResponseById(organizationId);
  }

  private async getOrganizationResponseById(organizationId: string): Promise<OrganizationResponse> {
    const organization = await OrganizationModel.findOne({ organizationId });
    if (!organization) {
      throw new Error('Organization not found');
    }

    const users = await UserModel.find({ organizations: organizationId });
    const members = users.map(user => ({
      userId: user.userId,
      email: user.email,
      role: user.role
    }));

    return {
      organizationId: organization.organizationId,
      organizationName: organization.organizationName,
      organizationDescription: organization.organizationDescription,
      createdAt: organization.createdAt,
      members
    };
  }
}
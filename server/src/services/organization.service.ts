import { OrganizationModel, UserModel } from 'shared';

export interface UserResponse {
  userId: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'manager' | 'dataCleaner';
  organizationRole: 'admin' | 'editor' | 'viewer';
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

export interface AddMemberRequest {
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export class OrganizationService {
  async createOrganization(data: CreateOrganizationRequest, userId: string): Promise<OrganizationResponse> {
    const organization = await OrganizationModel.create({
      ...data,
      members: [{ userId, role: 'admin' }]
    });
    
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

  async addUserToOrganization(organizationId: string, request: AddMemberRequest): Promise<OrganizationResponse> {
    const user = await UserModel.findOne({ email: request.email });
    if (!user) {
      throw new Error('User not found');
    }

    const organization = await OrganizationModel.findOne({ organizationId });
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check if user is already a member
    if (organization.members.some(m => m.userId === user.userId)) {
      throw new Error('User is already a member of this organization');
    }

    // Add member with role
    organization.members.push({
      userId: user.userId,
      role: request.role
    });
    await organization.save();

    // Add organization to user's organizations
    await UserModel.findOneAndUpdate(
      { userId: user.userId },
      { $addToSet: { organizations: organizationId } }
    );

    return this.getOrganizationResponseById(organizationId);
  }

  async removeUserFromOrganization(organizationId: string, userId: string): Promise<OrganizationResponse> {
    const organization = await OrganizationModel.findOne({ organizationId });
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Remove member
    organization.members = organization.members.filter(m => m.userId !== userId);
    await organization.save();

    // Remove organization from user's organizations
    await UserModel.findOneAndUpdate(
      { userId },
      { $pull: { organizations: organizationId } }
    );

    return this.getOrganizationResponseById(organizationId);
  }

  async updateMemberRole(organizationId: string, userId: string, role: 'admin' | 'editor' | 'viewer'): Promise<OrganizationResponse> {
    const organization = await OrganizationModel.findOne({ organizationId });
    if (!organization) {
      throw new Error('Organization not found');
    }

    const memberIndex = organization.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) {
      throw new Error('User is not a member of this organization');
    }

    organization.members[memberIndex].role = role;
    await organization.save();

    return this.getOrganizationResponseById(organizationId);
  }

  private async getOrganizationResponseById(organizationId: string): Promise<OrganizationResponse> {
    const organization = await OrganizationModel.findOne({ organizationId });
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get all member details
    const memberDetails = await Promise.all(
      organization.members.map(async (member) => {
        const user = await UserModel.findOne({ userId: member.userId });
        if (!user) return null;
        return {
          userId: user.userId,
          email: user.email,
          role: user.role,
          organizationRole: member.role
        };
      })
    );

    return {
      organizationId: organization.organizationId,
      organizationName: organization.organizationName,
      organizationDescription: organization.organizationDescription,
      createdAt: organization.createdAt,
      members: memberDetails.filter((m): m is UserResponse => m !== null)
    };
  }
}
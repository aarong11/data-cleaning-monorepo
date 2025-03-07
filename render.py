from graphviz import Digraph

# Create a new UML diagram with clusters for better organization.
uml_cluster = Digraph('DatasetCleaningUMLCluster', filename='dataset_cleaning_uml_cluster', format='png')

# Cluster: Data Management (Dataset, Record, Field)
with uml_cluster.subgraph(name='cluster_data') as c:
    c.attr(label='Data Management')
    c.node('Dataset', 'Dataset\n+ datasetId: UUID\n+ filename: String\n+ status: String\n+ size: Number\n+ uploadedAt: DateTime')
    c.node('Record', 'Record\n+ index: Number\n+ fields: JSON')
    c.node('Field', 'Field\n+ name: String\n+ value: String\n+ changed: Boolean\n+ newValue: String')

# Cluster: Processing (ProcessingJob)
with uml_cluster.subgraph(name='cluster_processing') as c:
    c.attr(label='Processing')
    c.node('ProcessingJob', 'ProcessingJob\n+ jobId: UUID\n+ datasetId: UUID\n+ status: String\n+ startedAt: DateTime')

# Cluster: Review (ReviewDecision, ReviewProgress)
with uml_cluster.subgraph(name='cluster_review') as c:
    c.attr(label='Review')
    c.node('ReviewDecision', 'ReviewDecision\n+ datasetId: UUID\n+ recordIndex: Number\n+ approved: Boolean\n+ comments: String')
    c.node('ReviewProgress', 'ReviewProgress\n+ datasetId: UUID\n+ totalRecords: Number\n+ reviewedRecords: Number\n+ progress: Number')

# Cluster: Users (User, Organization)
with uml_cluster.subgraph(name='cluster_users') as c:
    c.attr(label='Users')
    c.node('User', 'User\n+ userId: UUID\n+ email: String\n+ role: String')
    c.node('Organization', 'Organization\n+ orgId: UUID\n+ name: String\n+ members: List<UUID>')

# Define relationships between entities
uml_cluster.edge('Dataset', 'Record', label='contains')
uml_cluster.edge('Record', 'Field', label='has')
uml_cluster.edge('Dataset', 'ProcessingJob', label='processed by')
uml_cluster.edge('Dataset', 'ReviewProgress', label='tracks')
uml_cluster.edge('Record', 'ReviewDecision', label='reviewed by')
uml_cluster.edge('User', 'ReviewDecision', label='submits')
uml_cluster.edge('User', 'Dataset', label='uploads')
uml_cluster.edge('User', 'Organization', label='belongs to')
uml_cluster.edge('Organization', 'Dataset', label='owns')

# Render the UML diagram to a file
uml_cluster_path = './dataset_cleaning_uml_cluster.png'
uml_cluster.render(uml_cluster_path, format='png', cleanup=True)
uml_cluster_path

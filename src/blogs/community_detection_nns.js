export const post = {
  slug: "community-detection-neural-networks",
  title: "Community Detection with Neural Networks",
  date: "2022-04-10",
  tags: ["Neural Networks", "Graph Theory", "Machine Learning", "Research"],
  excerpt: "Using neural networks to solve community detection problems faster and more accurately than traditional algorithms like Girvan-Newman.",
  body: `This article is written for a class project and is a continuation of a previous article linked below. The previous article, written by  which describes how the Girvan Newman algorithm attempts to solve the community detection Problem:

See [Why Girvan-Newman?](https://medium.com/@trevordohm/68506e824e93) for context.

Before reading over this article, you may want to be familiar with the following topics:
- [Neural Networks](https://gmongaras.medium.com/how-do-neural-networks-work-bfdd3ca6c23a) or [how predictive models work](https://www.techtarget.com/searchenterpriseai/definition/predictive-modeling)
- [Simple Matrix Operations](https://www.khanacademy.org/math/precalculus/x9e81a4f98389efdf:matrices/x9e81a4f98389efdf:mat-intro/v/introduction-to-the-matrix)
- [Latent Spaces](https://towardsdatascience.com/understanding-latent-space-in-machine-learning-de5a7c687d8d)

Note: The theory we went over in this article was coded in the following repo and will be referenced throughout the article:

[https://github.com/gmongaras/22s-pa03-girvan-newman-uwunary-tree](https://github.com/gmongaras/22s-pa03-girvan-newman-uwunary-tree)

## The Community Detection Problem

Community detection is when one is given an unweighted, undirected graph and is trying to classify nodes into different communities based on how the nodes are connected to each other.

For example, take a look at the graph below:

![Alt text](/blogs/images/community_detection_nns/comm_detection.webp "https://towardsdatascience.com/community-detection-algorithms-9bd8951e7dae")

In this graph, you can see that the nodes are labeled by color signifying the community they belong to. Looking between the communities, we can see that there are usually few edges between those communities, but this isn't always the case.

In the previous article linked above, the Girvan Newman algorithm attempted to solve this task by removing edges one (or multiple) at a time. One problem with that algorithm is that it is really slow. In this article, we use a neural network to speed up the algorithm and perform the community detection in a single step.

## Encoding the Network

Before using a neural network to make predictions on communities, we first have to encode the graph in some sort of matrix form. To do this, we use modularity, and in fact, we use the same exact modularity matrix ($B$) which was used in the Girvan Newman algorithm.

A single value in the modularity matrix is found with the following formula:

![B formula](/blogs/images/community_detection_nns/b_formula.webp "B value formula")

- $a_{ij}$ = The probability that $i$ and $j$ are connected. This value can be represented as a 1 if $i$ and $j$ are connected via an edge and 0 if $i$ and $j$ are not connected. If $i$ is the same node as $j$, then the value is 0.
- $k_i$ = The degree or number of neighbors of node $i$
- $k_j$ = The degree or number of neighbors of node $j$
- $m$ = The number of edges in the graph

To form the matrix, $B_{ij}$ is produced for all $i$ and $j$ node combinations. So, the final matrix will be an $(N, N)$ matrix where the $i$th row is an encoded representation of node $i$ in the graph.

Below is a graph with 7 nodes and 9 edges which will be used as an example to calculate the $B$ matrix:

![Undirected graph with 7 nodes and 9 edges](/blogs/images/community_detection_nns/undir_graph.webp "Undirected graph with 7 nodes and 9 edges")

To start, we will first compute $B_{ij}$ when $i$ is node $A$ and $j$ is also node $A$:

![B value computation when i = A and j = A](/blogs/images/community_detection_nns/b_comp.webp "B value computation when i = A and j = A")

So, in the graph, when $i$ and $j$ are both $A$, the $B_{ij}$ value is -0.22. Below is another calculation, but using $i$ is equal to $A$ and $j$ is equal to $B$:

![B value computation when i = A and j = B](/blogs/images/community_detection_nns/5.webp "B value computation when i = A and j = B")

Performing this calculation on all $ij$ pairs, we get the following matrix:

![Complete B matrix](/blogs/images/community_detection_nns/6.webp "Complete B matrix")

Now we have an encoded version of the graph which can be fed into the neural network.

One key property of the graph is that each row can be regarded as a representation of that node. So node A can be thought of as the following vector:

$[-0.222, 0.667, 0.779, -0.444, -0.222, -0.333, -0.222]$

## Model Structure

Below is the model we are going to use:

![Neural Network Model Structure](/blogs/images/community_detection_nns/7.webp "Neural Network Model Structure")

- $B$ = The encoded form of the graph. This matrix has dimensions $N$ x $N$
- $H$ = An encoded form of the $B$ matrix. This matrix has dimensions $d$ x $N$
- $M$ = A decoded form of the $H$ matrix. This matrix has dimensions $N$ x $N$
- $N$ = Number of nodes in the graph
- $d$ = The dimension to encode the matrix to

Before explaining how this model is helpful at all, let's go over how it works.

The model is very simple. There are two neural networks that make up the model. The first is the encoder which attempts to encode the $B$ matrix to some type of encoded form which we will call $H$. The second model is the decoder which attempts to decode the encoded matrix, $H$, to the exact same matrix as $B$. This final matrix is denoted as $M$ since this matrix will likely be different from $B$ even though we want it to be the same.

You are probably wondering what the use of generating the exact same matrix is. Well, the output $M$ is actually useless in terms of community detection. The $H$ matrix is the useful part of this transformation and we will talk about why later in this article.

## Training the Model

Training the model is very nice and generating some training data is very easy, unlike most machine learning tasks. If you would like to see some Python code which implements a data generation algorithm, it can be found in [src/networkDataGeneration.py](https://github.com/gmongaras/22s-pa03-girvan-newman-uwunary-tree/blob/main/src/networkDataGeneration.py) in the GitHub repository linked above.

Essentially, to generate some data, we can generate a bunch of random graphs with $N$ nodes and save the $B$ matrices of those graphs which will be used to train the model.

So, now that we have the training data, we can train the model just like a normal machine learning model. Below are the steps to train the model:

1. Feed the $B$ matrix through the encoder to get an encoded version of that matrix, $H$
2. Feed the $H$ matrix through the decoder to get a decoded matrix, $M$
3. Use [Cross-Entropy Loss](https://machinelearningmastery.com/cross-entropy-for-machine-learning/) to see how far away the $M$ output matrix is from the $B$ input matrix
4. Update the parameters by backpropagating through the loss
5. Repeat steps 1-3 for all training data points
6. Repeat steps 1-4 until the number of training epochs has been reached

## What Is The H Matrix?

As stated earlier, we don't actually care about the $M$ matrix, which is the final output of the model. The $M$ matrix is just used so that the model can learn a good representation for the $H$ matrix. Instead, we care about the $H$ matrix. Let's look at the model one more time:

![Neural Network Model Structure](/blogs/images/community_detection_nns/7.webp "Neural Network Model Structure")

The $H$ matrix is some encoded form of the original *B* matrix graph encoding. Since this encoding needs to be decoded to the original $B$ matrix, the encoder will have to learn the best encodings for each node in the graph in order to give the decoder the easiest time when decoding the matrix. So, the $H$ matrix will be a really good representation of the initial $B$ matrix, meaning the $H$ matrix will be a really good encoding of the graph.

Note that the size of the $H$ matrix is $d$ x $N$ meaning that there are still $N$ rows. So, we can interpret each row of this new matrix as a new encoding for each node. Also, since the encoder will attempt to find the best representation of the matrix in the encoded latent space, each node will be encoded, and in this space, each node will be cut down to its most important features in order for the decoder to have an easier job decoding the matrix.

## Making Predictions Using The H Matrix

Since each node in the $H$ matrix is encoded to its most important features, it's probably safe to say that the encoding for each node will be useful to find communities between the nodes.

To find the communities in the latent space, an algorithm called $k$-means clustering will be applied to the $H$ matrix.

[***k*-means**](https://towardsdatascience.com/understanding-k-means-clustering-in-machine-learning-6a6e67336aa1) clustering is an algorithm that splits the data into $k$ groups based on how similar points are in the latent space. As an example, let's perform *k*-means clustering on the following graph:

![alt text](/blogs/images/community_detection_nns/8.webp "https://www.analyticsvidhya.com/blog/2021/04/k-means-clustering-simplified-in-python/")

Let's let $k$ be equal to 3. So, we want to cluster the data into three distinct groups based on how related the nodes are to each other.

![alt text](/blogs/images/community_detection_nns/9.webp "https://www.analyticsvidhya.com/blog/2021/04/k-means-clustering-simplified-in-python/")

Clearly, the groups above are the correct clusters since each point in the cluster is closer to the center of that cluster rather than it being closer to another center of another cluster. This is the basic idea of the *k*-means clustering algorithm.

Instead of a 2-d latent space, imagine a $d$ dimensional latent space with $N$ nodes in that space. This is what the $H$ matrix represents. Remember that every row in the $H$ matrix represents an encoded node in the graph. Along with each row being a representation of each node in the graph, these rows can be represented as a vector, or points in the $d$ dimensional latent space which can then be clustered.

So, like in the 2-d example, we can cluster nodes together using k-means clustering. If we know the number of groups, then this algorithm should give us some good results if the *H* matrix is a good representation of the important features of each node in the graph.

## Algorithm Results

Let's see how the Neural Network model performed against the Girvan Newman algorithm to see how much better it did.

To start, we generated 10 datasets with different average amounts of in-degree and out-degree counts. An in-degree of a node is the number of edges that connect to nodes in the same community while and out-degree is the number of edges that connect to nodes in a different community. So, if the out-degree count is higher, it will be harder to determine the proper communities of each node. Below is information on the 10 generated datasets:

![Test Dataset Statistics](/blogs/images/community_detection_nns/10.webp "Test Dataset Statistics")

Additionally, we also trained 11 different neural network models to test against the Girvan Newman algorithm. Below are the algorithms used where the first is Girvan Newman using an 80% subset and the others are the number of nodes in each layer in the neural network:

![Algorithms Being Tested](/blogs/images/community_detection_nns/11.webp "Algorithms Being Tested")

We trained each neural network model for 1000 epochs on 1000 $B$ matrices (numpy arrays) which can be found in the GitHub repo linked above. Below are the results for the average accuracy of each model:

![Algorithm Average Accuracy On All Datasets](/blogs/images/community_detection_nns/12.webp "Algorithm Average Accuracy On All Datasets")

It looks like the neural network models tend to outperform the Girvan Newman algorithm by up to 20%. If you are interested in all the data, below is a graph showing the results for all dataset tests:

![Algorithm Accuracy On Each Dataset](/blogs/images/community_detection_nns/13.webp "Algorithm Accuracy On Each Dataset")

Additionally, the Girvan Newman took around 40 seconds to run while the neural network took around 2 seconds to run on my laptop. So, it looks like the neural network model is clearly the better choice when picking between the Girvan Newman model or the Neural Network model.

The only real downside to the Neural Network algorithm shown in this article is that it takes some time to train, but on a laptop, it took at most a few hours to train the bigger models. Besides that, it looks like the Neural Network algorithm performs better in all ways to the Girvan Newman algorithm.

## References

- [https://www.ijcai.org/Proceedings/16/Papers/321.pdf](https://www.ijcai.org/Proceedings/16/Papers/321.pdf)
- [https://www.pnas.org/doi/full/10.1073/pnas.0601602103](https://www.pnas.org/doi/full/10.1073/pnas.0601602103)

`
}
